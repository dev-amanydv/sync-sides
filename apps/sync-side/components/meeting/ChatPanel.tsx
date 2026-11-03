"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import type { ChatMessage } from "@/lib/meeting/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
  onClose: () => void;
}

export default function ChatPanel({ messages, currentUserId, onSend, onClose }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    onSend(draft);
    setDraft("");
  };

  return (
    <div className="panel-slide flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <h2 className="text-[14px] font-medium">Chat</h2>
        <button onClick={onClose} className="text-[#62666D] transition-colors hover:text-white" aria-label="Close chat">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="lobby-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-[13px] text-[#62666D]">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = m.userId === currentUserId;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                {!mine && <span className="mb-1 px-1 text-[11px] text-[#8A8F98]">{m.userName}</span>}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                    mine ? "bg-[#5E6AD2] text-white" : "bg-white/[0.05] text-[#D0D3D9]"
                  }`}
                >
                  {m.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Send a message"
            className="w-full bg-transparent text-[13px] text-[#D0D3D9] placeholder:text-[#62666D] outline-none"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="text-[#5E6AD2] transition-colors hover:text-[#8A93E0] disabled:opacity-30"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
