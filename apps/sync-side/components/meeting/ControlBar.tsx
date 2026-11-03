"use client";

import type { ReactNode } from "react";
import {
  MicrophoneIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  PresentationChartBarIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import {
  MicrophoneIcon as MicrophoneSolid,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/solid";

interface ControlBarProps {
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  unreadCount: number;
  chatOpen: boolean;
  participantsOpen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
}

export default function ControlBar(p: ControlBarProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#131417]/90 px-2 py-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl">
      <Ctrl active={p.isMuted} variant="danger" title={p.isMuted ? "Unmute" : "Mute"} onClick={p.onToggleMute}>
        {p.isMuted ? <MicrophoneSolid className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
      </Ctrl>
      <Ctrl active={p.isVideoOff} variant="danger" title={p.isVideoOff ? "Start video" : "Stop video"} onClick={p.onToggleVideo}>
        {p.isVideoOff ? <VideoCameraSlashIcon className="h-5 w-5" /> : <VideoCameraIcon className="h-5 w-5" />}
      </Ctrl>
      <Ctrl active={!p.isSpeakerOn} variant="danger" title={p.isSpeakerOn ? "Mute speaker" : "Unmute speaker"} onClick={p.onToggleSpeaker}>
        {p.isSpeakerOn ? <SpeakerWaveIcon className="h-5 w-5" /> : <SpeakerXMarkIcon className="h-5 w-5" />}
      </Ctrl>
      <Ctrl active={p.isScreenSharing} variant="accent" title="Share screen" onClick={p.onToggleScreenShare}>
        <PresentationChartBarIcon className="h-5 w-5" />
      </Ctrl>

      {p.isHost && (
        <Ctrl active={p.isRecording} variant="danger" title={p.isRecording ? "Stop recording" : "Start recording"} onClick={p.onToggleRecording}>
          <span className={`h-3.5 w-3.5 ${p.isRecording ? "rounded-[3px] bg-white" : "rounded-full bg-[#EB5757]"}`} />
        </Ctrl>
      )}

      <div className="mx-1 h-6 w-px bg-white/[0.08]" />

      <Ctrl active={p.chatOpen} variant="accent" title="Chat" onClick={p.onToggleChat}>
        <ChatBubbleLeftIcon className="h-5 w-5" />
        {p.unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EB5757] px-1 text-[10px] font-semibold text-white">
            {p.unreadCount}
          </span>
        )}
      </Ctrl>
      <Ctrl active={p.participantsOpen} variant="accent" title="Participants" onClick={p.onToggleParticipants}>
        <UserGroupIcon className="h-5 w-5" />
      </Ctrl>

      <div className="mx-1 h-6 w-px bg-white/[0.08]" />

      <button
        onClick={p.onLeave}
        title={p.isHost ? "End meeting" : "Leave"}
        className="flex h-11 items-center gap-2 rounded-xl bg-[#EB5757] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#D64C4C] active:scale-95"
      >
        <PhoneIcon className="h-5 w-5 rotate-[135deg]" />
        <span className="hidden sm:inline">{p.isHost ? "End" : "Leave"}</span>
      </button>
    </div>
  );
}

function Ctrl({
  active,
  variant,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  variant: "danger" | "accent";
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const activeClass =
    variant === "danger" ? "bg-[#EB5757] text-white hover:bg-[#D64C4C]" : "bg-[#5E6AD2] text-white hover:bg-[#6E79D6]";
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 ${
        active ? activeClass : "text-[#D0D3D9] hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
