"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useMeetingSession } from "@/hooks/useMeetingSession";
import { fetchMeetingDetails, joinMeeting } from "@/lib/meeting/api";
import { loadPreferences } from "@/lib/preferences";
import type { MeetingDetails, SessionUser } from "@/lib/meeting/types";
import Lobby from "@/components/meeting/Lobby";
import MeetingRoom from "@/components/meeting/MeetingRoom";
import PostMeeting from "@/components/meeting/PostMeeting";

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params?.id as string;
  const { data: session } = useSession();

  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [joining, setJoining] = useState(false);
  // Seed meeting defaults from the user's saved Settings preferences.
  const [prefs] = useState(() => loadPreferences());
  const [autoRecord, setAutoRecord] = useState(prefs.autoRecord);

  const media = useMediaDevices();

  const user: SessionUser | null = useMemo(() => {
    if (!session?.user?.id) return null;
    return {
      userId: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      image: session.user.image ?? "",
    };
  }, [session]);

  const isHost = !!(meeting && user && Number(user.userId) === meeting.hostId);

  useEffect(() => {
    if (!meetingId) return;
    const ac = new AbortController();
    fetchMeetingDetails(meetingId, ac.signal)
      .then(setMeeting)
      .catch((err) => {
        if (err.name !== "AbortError") setLoadError(err.message);
      });
    return () => ac.abort();
  }, [meetingId]);

  const meetingSession = useMeetingSession({
    active: live,
    meeting: meeting ?? { id: 0, meetingId: "", hostId: 0, title: "" },
    user: user ?? { userId: "", name: "", email: "", image: "" },
    isHost,
    stream: media.stream,
    autoRecord,
    initialMuted: !prefs.micOn,
    initialVideoOff: !prefs.cameraOn,
  });

  const handleJoin = async () => {
    if (!meeting || !user) return;
    setJoining(true);
    try {
      await joinMeeting(meeting.meetingId, Number(user.userId));
      setLive(true);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setJoining(false);
    }
  };

  if (loadError) return <FullScreenMessage title="Can't open meeting" detail={loadError} />;
  if (!meetingId) return <FullScreenMessage title="Invalid meeting link" detail="Check your link and try again." />;
  if (!meeting || !user) return <FullScreenLoader />;

  if (meetingSession.ended) {
    return <PostMeeting meeting={meeting} user={user} durationMs={meetingSession.durationMs} />;
  }

  if (live) {
    return (
      <MeetingRoom
        meeting={meeting}
        user={user}
        isHost={isHost}
        localStream={media.stream}
        session={meetingSession}
      />
    );
  }

  return (
    <Lobby
      meeting={meeting}
      user={user}
      isHost={isHost}
      media={media}
      autoRecord={autoRecord}
      onAutoRecordChange={setAutoRecord}
      onJoin={handleJoin}
      joining={joining}
    />
  );
}

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#08090A] text-[#F7F8F8] [font-family:var(--font-geist-sans)]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#5E6AD2]" />
        <p className="text-[13px] text-[#8A8F98]">Preparing your meeting…</p>
      </div>
    </div>
  );
}

function FullScreenMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#08090A] text-[#F7F8F8] [font-family:var(--font-geist-sans)]">
      <div className="lobby-rise text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
          <ExclamationTriangleIcon className="h-5 w-5 text-[#F2C94C]" />
        </div>
        <h1 className="text-lg font-medium tracking-[-0.01em]">{title}</h1>
        <p className="mt-1 text-[13px] text-[#8A8F98]">{detail}</p>
      </div>
    </div>
  );
}
