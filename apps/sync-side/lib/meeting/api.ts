// Typed fetch helpers for the backend REST API. Every call goes through
// NEXT_PUBLIC_BACKEND_URL (REST + Socket.IO share the same origin).

import type { MeetingDetails, RecordingInfo } from "./types";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface RawMeetingResponse {
  meeting: {
    id: number;
    meetingId: string;
    hostId: number;
    title: string | null;
  };
}

export async function fetchMeetingDetails(
  meetingId: string,
  signal?: AbortSignal
): Promise<MeetingDetails> {
  const res = await fetch(`${BASE}/api/meeting/details/${meetingId}`, { signal });
  if (!res.ok) throw new Error(`Failed to load meeting (${res.status})`);
  const { meeting } = (await res.json()) as RawMeetingResponse;
  return {
    id: meeting.id,
    meetingId: meeting.meetingId,
    hostId: meeting.hostId,
    title: meeting.title ?? "Untitled meeting",
  };
}

export async function joinMeeting(meetingId: string, userId: number): Promise<void> {
  const res = await fetch(`${BASE}/api/meeting/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingId, userId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Join failed (${res.status})`);
  }
}

// Uploads a single recording chunk. The metadata fields MUST be appended
// before the file so multer's diskStorage can read them in its destination
// callback (which runs as the file field streams in).
export async function uploadChunk(
  meetingId: string,
  userId: string,
  chunkIndex: number,
  blob: Blob
): Promise<void> {
  const form = new FormData();
  form.append("meetingId", meetingId);
  form.append("userId", userId);
  form.append("chunkIndex", String(chunkIndex));
  form.append("chunk", blob, `chunk-${chunkIndex}.webm`);

  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Chunk ${chunkIndex} upload failed (${res.status})`);
}

export async function fetchRecording(meetingId: string): Promise<RecordingInfo | null> {
  const res = await fetch(`${BASE}/api/recordings/${meetingId}`);
  if (!res.ok) throw new Error(`Failed to load recording (${res.status})`);
  const { recording } = (await res.json()) as { recording: RecordingInfo | null };
  return recording;
}

export async function submitFeedback(
  meetingId: string,
  userId: number,
  rating: number,
  comment?: string
): Promise<void> {
  const res = await fetch(`${BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingId, userId, rating, comment }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Feedback failed (${res.status})`);
  }
}
