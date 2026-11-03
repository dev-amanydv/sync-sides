"use client";

import {
  XMarkIcon,
  MicrophoneIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/outline";
import { MicrophoneIcon as MicrophoneSolid } from "@heroicons/react/24/solid";
import type { Participant } from "@/lib/meeting/types";

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUserId: string;
  onClose: () => void;
}

export default function ParticipantsPanel({ participants, currentUserId, onClose }: ParticipantsPanelProps) {
  return (
    <div className="panel-slide flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <h2 className="text-[14px] font-medium">
          Participants <span className="text-[#62666D]">{participants.length}</span>
        </h2>
        <button onClick={onClose} className="text-[#62666D] transition-colors hover:text-white" aria-label="Close participants">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="lobby-scroll flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {participants.map((p) => {
          const name = p.name || p.email.split("@")[0] || "Guest";
          const mine = p.id === Number(currentUserId);
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.03]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5E6AD2]/20 text-[13px] font-medium text-[#9AA2E8]">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-[#D0D3D9]">
                  {name} {mine && <span className="text-[#62666D]">(you)</span>}
                </p>
                {p.isHost && <p className="text-[11px] text-[#8A8F98]">Host</p>}
              </div>
              <div className="flex items-center gap-1.5 text-[#8A8F98]">
                {p.isMuted && <MicrophoneSolid className="h-4 w-4 text-[#EB5757]" />}
                {!p.isMuted && <MicrophoneIcon className="h-4 w-4" />}
                {p.isVideoOff && <VideoCameraSlashIcon className="h-4 w-4 text-[#EB5757]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
