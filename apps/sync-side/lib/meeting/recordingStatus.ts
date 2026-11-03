// Maps a meeting's recording state to a badge the dashboard/recordings lists
// render. The backend exposes the live pipeline status (recording → uploading →
// processing → available/failed); older meetings only have the `recorded` flag.

import type { RecordingStatus } from "./types";

export interface RecordingBadge {
  label: string;
  className: string;
  pulse: boolean; // animated dot for in-progress states
  available: boolean; // recording is playable/downloadable
  transient: boolean; // still moving through the pipeline → poll for updates
}

interface MeetingLike {
  recorded?: boolean;
  recording?: { status: RecordingStatus } | null;
}

const BADGES: Record<RecordingStatus, Omit<RecordingBadge, "available" | "transient">> = {
  recording: {
    label: "Recording…",
    className: "bg-[#EB5757]/15 text-[#F08C8C]",
    pulse: true,
  },
  uploading: {
    label: "Uploading…",
    className: "bg-amber-500/15 text-amber-300",
    pulse: true,
  },
  processing: {
    label: "Merging…",
    className: "bg-[#5E6AD2]/20 text-[#9AA2E8]",
    pulse: true,
  },
  available: {
    label: "Recording Available",
    className: "bg-green-800 text-green-400",
    pulse: false,
  },
  failed: {
    label: "Recording Failed",
    className: "bg-red-900/40 text-red-300",
    pulse: false,
  },
};

const NOT_RECORDED: RecordingBadge = {
  label: "Not Recorded",
  className: "bg-gray-400 text-neutral-900",
  pulse: false,
  available: false,
  transient: false,
};

export function recordingBadge(meeting: MeetingLike): RecordingBadge {
  const status = meeting.recording?.status;

  if (!status) {
    // Legacy rows predate the Recording table but were flagged as recorded.
    return meeting.recorded ? { ...BADGES.available, available: true, transient: false } : NOT_RECORDED;
  }

  return {
    ...BADGES[status],
    available: status === "available",
    transient: status === "recording" || status === "uploading" || status === "processing",
  };
}
