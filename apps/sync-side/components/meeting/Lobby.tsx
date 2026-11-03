"use client";

import { useEffect, useRef, useState } from "react";
import {
  VideoCameraIcon,
  MicrophoneIcon,
  LinkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { MediaDevicesState } from "@/hooks/useMediaDevices";
import type { MeetingDetails, SessionUser } from "@/lib/meeting/types";

interface LobbyProps {
  meeting: MeetingDetails;
  user: SessionUser;
  isHost: boolean;
  media: MediaDevicesState;
  autoRecord: boolean;
  onAutoRecordChange: (value: boolean) => void;
  onJoin: () => void;
  joining: boolean;
}

export default function Lobby({
  meeting,
  user,
  isHost,
  media,
  autoRecord,
  onAutoRecordChange,
  onJoin,
  joining,
}: LobbyProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (videoRef.current && media.stream) videoRef.current.srcObject = media.stream;
  }, [media.stream]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#08090A] text-[#F7F8F8] antialiased [font-family:var(--font-geist-sans)]">
      <div className="lobby-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center gap-8 px-4 py-10 lg:flex-row lg:items-stretch">
        {/* Camera preview */}
        <div className="lobby-rise w-full max-w-xl">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0F11] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)]">
            {media.error ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <ExclamationTriangleIcon className="h-7 w-7 text-[#F2C94C]" />
                <p className="text-[13px] text-[#8A8F98]">{media.error}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full -scale-x-100 object-cover"
              />
            )}
            <div className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2.5 py-1 text-[12px] font-medium backdrop-blur-sm">
              {user.name || user.email.split("@")[0]}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lobby-rise flex w-full max-w-sm flex-col justify-center gap-6" style={{ animationDelay: "0.08s" }}>
          <div>
            <h1 className="text-[22px] font-medium tracking-[-0.02em]">{meeting.title}</h1>
            <p className="mt-1 text-[13px] text-[#8A8F98]">
              {isHost ? "You're the host. " : ""}Set up your camera and mic, then join.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <DeviceSelect
              icon={<VideoCameraIcon className="h-4 w-4 text-[#8A8F98]" />}
              value={media.cameraId ?? media.cameras[0]?.deviceId ?? ""}
              onChange={media.selectCamera}
              options={media.cameras}
              placeholder="Camera"
            />
            <DeviceSelect
              icon={<MicrophoneIcon className="h-4 w-4 text-[#8A8F98]" />}
              value={media.micId ?? media.mics[0]?.deviceId ?? ""}
              onChange={media.selectMic}
              options={media.mics}
              placeholder="Microphone"
            />
          </div>

          {isHost && (
            <button
              type="button"
              role="switch"
              aria-checked={autoRecord}
              onClick={() => onAutoRecordChange(!autoRecord)}
              className={`group flex items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-colors ${
                autoRecord
                  ? "border-[#5E6AD2]/40 bg-[#5E6AD2]/[0.08]"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  autoRecord ? "bg-[#5E6AD2]/15 text-[#8C93E8]" : "bg-white/[0.04] text-[#8A8F98]"
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  {autoRecord && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EB5757] opacity-60" />
                  )}
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                      autoRecord ? "bg-[#EB5757]" : "bg-current"
                    }`}
                  />
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium">Record automatically</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-[#8A8F98]">
                  Starts recording once your guest joins.
                </span>
              </span>

              <span
                className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
                  autoRecord ? "bg-[#5E6AD2]" : "bg-white/[0.12]"
                }`}
              >
                <span
                  className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    autoRecord ? "translate-x-[19px]" : "translate-x-[3px]"
                  }`}
                />
              </span>
            </button>
          )}

          <button
            onClick={copyLink}
            className="flex items-center gap-2 self-start rounded-lg border border-white/[0.08] px-3 py-2 text-[13px] text-[#D0D3D9] transition-colors hover:bg-white/[0.05]"
          >
            {copied ? <CheckIcon className="h-4 w-4 text-[#4CB782]" /> : <LinkIcon className="h-4 w-4" />}
            {copied ? "Link copied" : "Copy invite link"}
          </button>

          <button
            onClick={onJoin}
            disabled={joining || !media.stream}
            className="flex h-11 items-center justify-center rounded-xl bg-[#5E6AD2] text-[14px] font-medium text-white transition-colors hover:bg-[#6E79D6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {joining ? "Joining…" : "Join meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeviceSelect({
  icon,
  value,
  onChange,
  options,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (id: string) => void;
  options: MediaDeviceInfo[];
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
      {icon}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[13px] text-[#D0D3D9] outline-none [&>option]:bg-[#131417]"
      >
        {options.length === 0 && <option value="">{placeholder}</option>}
        {options.map((d, i) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `${placeholder} ${i + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
}
