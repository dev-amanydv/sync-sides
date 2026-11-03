"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  StarIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { fetchRecording, submitFeedback } from "@/lib/meeting/api";
import type { MeetingDetails, RecordingInfo, SessionUser } from "@/lib/meeting/types";

interface PostMeetingProps {
  meeting: MeetingDetails;
  user: SessionUser;
  durationMs: number;
}

export default function PostMeeting({ meeting, user, durationMs }: PostMeetingProps) {
  const router = useRouter();
  const [recording, setRecording] = useState<RecordingInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll the recording status until it settles (available or failed).
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const rec = await fetchRecording(meeting.meetingId);
        if (cancelled) return;
        setRecording(rec);
        if (rec && (rec.status === "available" || rec.status === "failed") && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        /* keep polling */
      }
    };
    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [meeting.meetingId]);

  const send = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await submitFeedback(meeting.meetingId, Number(user.userId), rating, comment);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#08090A] text-[#F7F8F8] antialiased [font-family:var(--font-geist-sans)]">
      <div className="lobby-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-full max-w-lg flex-col justify-center gap-6 px-4 py-12">
        <div className="lobby-rise text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
            <CheckCircleIcon className="h-6 w-6 text-[#4CB782]" />
          </div>
          <h1 className="text-[22px] font-medium tracking-[-0.02em]">Meeting ended</h1>
          <p className="mt-1 text-[13px] text-[#8A8F98]">
            {meeting.title} · {formatDuration(durationMs)}
          </p>
        </div>

        {/* Recording card */}
        <div className="lobby-rise rounded-2xl border border-white/[0.06] bg-[#0E0F11] p-5" style={{ animationDelay: "0.06s" }}>
          <RecordingCard recording={recording} />
        </div>

        {/* Feedback */}
        <div className="lobby-rise rounded-2xl border border-white/[0.06] bg-[#0E0F11] p-5" style={{ animationDelay: "0.12s" }}>
          {submitted ? (
            <div className="flex items-center gap-3 py-2">
              <CheckCircleIcon className="h-5 w-5 text-[#4CB782]" />
              <p className="text-[13px] text-[#D0D3D9]">Thanks for your feedback!</p>
            </div>
          ) : (
            <>
              <h2 className="text-[14px] font-medium">How was your meeting?</h2>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = n <= (hover || rating);
                  return (
                    <button
                      key={n}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                    >
                      {filled ? (
                        <StarSolid className="h-7 w-7 text-[#F2C94C]" />
                      ) : (
                        <StarIcon className="h-7 w-7 text-[#3A3D44]" />
                      )}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Anything you'd like to share? (optional)"
                rows={3}
                className="mt-4 w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-[13px] text-[#D0D3D9] placeholder:text-[#62666D] outline-none focus:border-[#5E6AD2]/50"
              />
              <button
                onClick={send}
                disabled={!rating || submitting}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-[#5E6AD2] text-[13px] font-medium text-white transition-colors hover:bg-[#6E79D6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Submit feedback"}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="lobby-rise mx-auto text-[13px] text-[#8A8F98] transition-colors hover:text-white"
          style={{ animationDelay: "0.18s" }}
        >
          Return to dashboard
        </button>
      </div>
    </div>
  );
}

function RecordingCard({ recording }: { recording: RecordingInfo | null }) {
  if (!recording) {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] text-[#62666D]">—</div>
        <div>
          <p className="text-[13px] font-medium text-[#D0D3D9]">No recording</p>
          <p className="text-[12px] text-[#62666D]">This meeting wasn&apos;t recorded.</p>
        </div>
      </div>
    );
  }

  if (recording.status === "available" && recording.url) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[#4CB782]">
          <CheckCircleIcon className="h-4 w-4" /> Recording ready
        </div>
        <div className="flex gap-2">
          <a
            href={recording.url}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#5E6AD2] text-[13px] font-medium text-white transition-colors hover:bg-[#6E79D6]"
          >
            <PlayIcon className="h-4 w-4" /> Play
          </a>
          <a
            href={recording.url}
            download
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] text-[13px] text-[#D0D3D9] transition-colors hover:bg-white/[0.05]"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Download
          </a>
        </div>
      </div>
    );
  }

  if (recording.status === "failed") {
    return (
      <div className="flex items-center gap-3 py-1">
        <ExclamationTriangleIcon className="h-5 w-5 text-[#EB5757]" />
        <div>
          <p className="text-[13px] font-medium text-[#D0D3D9]">Processing failed</p>
          <p className="text-[12px] text-[#62666D]">We couldn&apos;t produce the recording.</p>
        </div>
      </div>
    );
  }

  // recording | uploading | processing
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#5E6AD2]" />
      <div>
        <p className="text-[13px] font-medium text-[#D0D3D9]">Preparing your recording…</p>
        <p className="text-[12px] text-[#62666D]">This may take a minute. You can leave — it&apos;ll be in Recordings.</p>
      </div>
    </div>
  );
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}
