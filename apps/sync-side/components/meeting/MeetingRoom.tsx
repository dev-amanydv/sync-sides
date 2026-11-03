"use client";

import { useEffect, useRef, useState } from "react";
import { VideoCameraSlashIcon } from "@heroicons/react/24/solid";
import { MAX_RECORDING_MS, type MeetingSession } from "@/hooks/useMeetingSession";
import type { MeetingDetails, SessionUser } from "@/lib/meeting/types";
import ControlBar from "./ControlBar";
import ChatPanel from "./ChatPanel";
import ParticipantsPanel from "./ParticipantsPanel";

interface MeetingRoomProps {
  meeting: MeetingDetails;
  user: SessionUser;
  isHost: boolean;
  localStream: MediaStream | null;
  session: MeetingSession;
}

export default function MeetingRoom({ meeting, user, isHost, localStream, session }: MeetingRoomProps) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const [panel, setPanel] = useState<"none" | "chat" | "participants">("none");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = session.remoteStream;
  }, [session.remoteStream]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.muted = !isSpeakerOn;
  }, [isSpeakerOn, session.remoteStream]);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(id);
  }, []);

  const remotePeer = session.participants.find((p) => p.id !== Number(user.userId));
  // Remember the last remote name so we can still label them after they leave
  // (they drop out of the participants list on disconnect).
  const lastRemoteNameRef = useRef("Guest");
  if (remotePeer) {
    lastRemoteNameRef.current = remotePeer.name || remotePeer.email?.split("@")[0] || "Guest";
  }
  const remoteName = lastRemoteNameRef.current;
  const panelOpen = panel !== "none";

  const openPanel = (next: "chat" | "participants") => {
    setPanel((cur) => (cur === next ? "none" : next));
    if (next === "chat") session.markChatRead();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#08090A] text-[#F7F8F8] antialiased [font-family:var(--font-geist-sans)]">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-black/40 px-3 py-1.5 text-[12px] backdrop-blur-sm">
          <span className="font-medium">{meeting.title}</span>
          <span className="text-[#62666D]">·</span>
          <span className="tabular-nums text-[#8A8F98]">{formatDuration(elapsed)}</span>
        </div>
        {session.isRecording && (
          <div
            className="flex items-center gap-2 rounded-lg bg-[#EB5757]/15 px-3 py-1.5 text-[12px] font-medium text-[#F08C8C] backdrop-blur-sm"
            title="Recordings are capped at 5 minutes"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#EB5757]" />
            REC
            <span className="tabular-nums text-[#F08C8C]/80">
              {formatDuration(Math.max(MAX_RECORDING_MS - session.recordingMs, 0))} left
            </span>
          </div>
        )}
      </div>

      {/* Video stage */}
      <div className={`absolute inset-0 p-2 transition-[padding] duration-300 sm:p-3 ${panelOpen ? "sm:pr-[21rem]" : ""}`}>
        <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0F11]">
          {session.remoteStream ? (
            <>
              <video ref={remoteRef} autoPlay playsInline className="h-full w-full object-cover" />
              {remotePeer?.isVideoOff && <Avatar name={remoteName} />}
            </>
          ) : session.remoteLeft ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#5E6AD2]/15 text-2xl font-medium text-[#9AA2E8]">
                {remoteName.charAt(0).toUpperCase()}
              </div>
              <p className="text-[13px] text-[#8A8F98]">{remoteName} left the meeting</p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#5E6AD2]" />
              <p className="text-[13px] text-[#8A8F98]">Waiting for {remoteName} to connect…</p>
            </div>
          )}

          {/* Local PiP */}
          <div className="absolute bottom-4 right-4 aspect-video w-40 overflow-hidden rounded-xl border border-white/[0.1] bg-[#131417] shadow-lg sm:w-52">
            <video ref={localRef} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            {session.isVideoOff && <Avatar name={user.name || user.email} small />}
            <div className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] backdrop-blur-sm">You</div>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {panelOpen && (
        <div className="absolute bottom-0 right-0 top-0 z-30 w-full max-w-[20rem] border-l border-white/[0.06] bg-[#0B0C0E]">
          {panel === "chat" ? (
            <ChatPanel
              messages={session.messages}
              currentUserId={user.userId}
              onSend={session.sendMessage}
              onClose={() => setPanel("none")}
            />
          ) : (
            <ParticipantsPanel
              participants={session.participants}
              currentUserId={user.userId}
              onClose={() => setPanel("none")}
            />
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
        <ControlBar
          isHost={isHost}
          isMuted={session.isMuted}
          isVideoOff={session.isVideoOff}
          isSpeakerOn={isSpeakerOn}
          isScreenSharing={session.isScreenSharing}
          isRecording={session.isRecording}
          unreadCount={session.unreadCount}
          chatOpen={panel === "chat"}
          participantsOpen={panel === "participants"}
          onToggleMute={session.toggleMute}
          onToggleVideo={session.toggleVideo}
          onToggleSpeaker={() => setIsSpeakerOn((v) => !v)}
          onToggleScreenShare={session.toggleScreenShare}
          onToggleRecording={session.isRecording ? session.stopRecording : session.startRecording}
          onToggleChat={() => openPanel("chat")}
          onToggleParticipants={() => openPanel("participants")}
          onLeave={isHost ? session.endMeeting : session.leave}
        />
      </div>
    </div>
  );
}

function Avatar({ name, small }: { name: string; small?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#131417]">
      <div
        className={`flex items-center justify-center rounded-full bg-[#5E6AD2]/20 font-medium text-[#9AA2E8] ${
          small ? "h-10 w-10 text-sm" : "h-24 w-24 text-3xl"
        }`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      {!small && (
        <div className="flex items-center gap-1.5 text-[13px] text-[#8A8F98]">
          <VideoCameraSlashIcon className="h-4 w-4" /> Camera off
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m % 60)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}
