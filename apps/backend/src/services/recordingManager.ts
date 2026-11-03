import { prisma } from "../lib/prisma.js";
import { enqueueMerge } from "./recordingPipeline.js";

// Tracks live recording sessions in memory. After a stop we wait for every
// recording client to confirm its final chunk upload (`recording-uploaded`)
// before merging; the timeout covers clients that vanished (closed tab).
const UPLOAD_FLUSH_TIMEOUT_MS = 45_000;

// Hard cap on how long a single recording may run. Prevents anonymous/visitor
// abuse from filling up R2 with hours-long recordings — the server force-stops
// and merges whatever was captured at the cap.
export const MAX_RECORDING_MS = 5 * 60 * 1000;

interface Session {
  meetingId: string; // shareable string id (upload dir name)
  recorderIds: Set<number>; // userIds recording
  pending: Set<number> | null; // non-null once stopped: uploads still awaited
  startedAt: number;
  timer: NodeJS.Timeout | null;
  maxTimer: NodeJS.Timeout | null; // fires the 5-min hard cap
}

const sessions = new Map<number, Session>();

// The socket layer registers this so the manager can tell clients to stop
// their MediaRecorders when the server force-stops at the cap.
let autoStopHandler: ((meetingNoId: number) => void) | null = null;
export const setAutoStopHandler = (fn: (meetingNoId: number) => void) => {
  autoStopHandler = fn;
};

export const isRecording = (meetingNoId: number) =>
  sessions.has(meetingNoId) && sessions.get(meetingNoId)!.pending === null;

export const startRecording = async (
  meetingNoId: number,
  meetingId: string,
  recorderIds: number[]
) => {
  if (sessions.has(meetingNoId)) return;
  const session: Session = {
    meetingId,
    recorderIds: new Set(recorderIds),
    pending: null,
    startedAt: Date.now(),
    timer: null,
    maxTimer: null,
  };
  session.maxTimer = setTimeout(() => {
    console.warn(`Meeting ${meetingId}: recording hit ${MAX_RECORDING_MS}ms cap, force-stopping`);
    autoStopHandler?.(meetingNoId); // tell clients to stop + flush their recorders
    stopRecording(meetingNoId).catch(() => {});
  }, MAX_RECORDING_MS);
  sessions.set(meetingNoId, session);
  await prisma.recording.upsert({
    where: { meetingNoId },
    update: { status: "recording", url: null, error: null, durationMs: null },
    create: { meetingNoId, status: "recording" },
  });
};

export const addRecorder = (meetingNoId: number, userId: number) => {
  const session = sessions.get(meetingNoId);
  if (session && session.pending === null) session.recorderIds.add(userId);
};

export const stopRecording = async (meetingNoId: number) => {
  const session = sessions.get(meetingNoId);
  if (!session || session.pending !== null) return;

  if (session.maxTimer) clearTimeout(session.maxTimer);
  session.maxTimer = null;
  session.pending = new Set(session.recorderIds);
  const durationMs = Date.now() - session.startedAt;
  await prisma.recording
    .update({ where: { meetingNoId }, data: { status: "uploading", durationMs } })
    .catch(() => {});

  session.timer = setTimeout(() => {
    console.warn(
      `Meeting ${session.meetingId}: upload flush timed out, merging with available chunks`
    );
    finish(meetingNoId);
  }, UPLOAD_FLUSH_TIMEOUT_MS);
};

export const confirmUploaded = (meetingNoId: number, userId: number) => {
  const session = sessions.get(meetingNoId);
  if (!session?.pending) return;
  session.pending.delete(userId);
  if (session.pending.size === 0) finish(meetingNoId);
};

const finish = (meetingNoId: number) => {
  const session = sessions.get(meetingNoId);
  if (!session) return;
  if (session.timer) clearTimeout(session.timer);
  if (session.maxTimer) clearTimeout(session.maxTimer);
  sessions.delete(meetingNoId);

  prisma.recording
    .update({ where: { meetingNoId }, data: { status: "processing" } })
    .catch(() => {});
  enqueueMerge(meetingNoId, session.meetingId);
};
