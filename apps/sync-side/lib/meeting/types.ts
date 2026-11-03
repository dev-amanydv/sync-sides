// Shared types for the meeting experience.

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  image: string;
}

export interface Participant {
  id: number;
  email: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface MeetingDetails {
  id: number; // Meeting.id (meetingNoId)
  meetingId: string; // shareable code
  hostId: number;
  title: string;
}

export type RecordingStatus =
  | "recording"
  | "uploading"
  | "processing"
  | "available"
  | "failed";

export interface RecordingInfo {
  status: RecordingStatus;
  url: string | null;
  durationMs: number | null;
  updatedAt: string;
}

export type MeetingPhase = "lobby" | "live" | "ended";
