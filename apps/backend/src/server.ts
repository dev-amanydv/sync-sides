import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";
import authRoutes from "./routes/auth.js";
import meetingRoutes from "./routes/meeting.js";
import uploadRoutes from "./routes/upload.js";
import recordingRoutes from "./routes/recordings.js";
import feedbackRoutes from "./routes/feedback.js";
import { prisma } from "./lib/prisma.js";
import { MERGED_DIR } from "./services/recordingPipeline.js";
import * as recorder from "./services/recordingManager.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Locally-merged videos (only used when R2 isn't configured)
app.use("/merged", express.static(MERGED_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/meeting", meetingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/feedback", feedbackRoutes);

app.get("/", (_req, res) => {
  res.send("SyncSides backend is running");
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError || err?.message?.startsWith("Invalid")) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

interface SocketUser {
  userId: number;
  meetingNoId: number;
  meetingId: string;
  email: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

const socketUserMap = new Map<string, SocketUser>();

const roomName = (meetingNoId: number) => `meeting:${meetingNoId}`;

// When a recording hits the server-side duration cap, tell every client in the
// room to stop and flush their MediaRecorder (mirrors an explicit stop).
recorder.setAutoStopHandler((meetingNoId) => {
  io.to(roomName(meetingNoId)).emit("recording-stopped");
});

const participantsIn = (meetingNoId: number) =>
  Array.from(socketUserMap.entries())
    .filter(([, u]) => u.meetingNoId === meetingNoId)
    .map(([socketId, u]) => ({
      id: u.userId,
      email: u.email,
      name: u.name,
      socketId,
      isHost: u.isHost,
    }));

// Recording is stopped and the merge queued; meeting-ended is broadcast.
const endMeeting = async (entry: SocketUser) => {
  const { meetingNoId } = entry;
  if (recorder.isRecording(meetingNoId)) {
    io.to(roomName(meetingNoId)).emit("recording-stopped");
    await recorder.stopRecording(meetingNoId);
  }
  const durationMs = Date.now() - entry.joinedAt;
  await prisma.meeting
    .update({ where: { id: meetingNoId }, data: { durationMs } })
    .catch((err) => console.error("Failed to save meeting duration:", err));
  io.to(roomName(meetingNoId)).emit("meeting-ended", { durationMs });
};

io.on("connection", (socket) => {
  socket.on("join-meeting", async ({ meetingNoId, user }) => {
    try {
      const noId = Number(meetingNoId);
      const meeting = await prisma.meeting.findUnique({
        where: { id: noId },
        select: { hostId: true, meetingId: true },
      });
      if (!meeting) {
        socket.emit("join-error", { error: "Meeting not found" });
        return;
      }

      // 1:1 meetings — a third connection is rejected up front.
      const present = participantsIn(noId);
      if (present.length >= 2 && !present.some((p) => p.id === Number(user.userId))) {
        socket.emit("join-error", { error: "This meeting is full" });
        return;
      }

      // A refresh reconnects before the old socket times out — drop the
      // stale entry so the user isn't listed twice.
      for (const [sid, u] of socketUserMap) {
        if (u.userId === Number(user.userId) && u.meetingNoId === noId) {
          socketUserMap.delete(sid);
        }
      }

      socket.join(roomName(noId));
      socketUserMap.set(socket.id, {
        userId: Number(user.userId),
        meetingNoId: noId,
        meetingId: meeting.meetingId,
        email: user.email ?? "",
        name: user.name ?? "",
        isHost: Number(user.userId) === meeting.hostId,
        joinedAt: Date.now(),
      });

      await prisma.participant.upsert({
        where: { userId_meetingNoId: { userId: Number(user.userId), meetingNoId: noId } },
        update: { hasJoined: true, joinedAt: new Date() },
        create: { userId: Number(user.userId), meetingNoId: noId, hasJoined: true, joinedAt: new Date() },
      });

      io.to(roomName(noId)).emit("participants-updated", participantsIn(noId));
    } catch (err) {
      console.error("Error handling join-meeting:", err);
      socket.emit("join-error", { error: "Failed to join meeting" });
    }
  });

  // --- WebRTC signaling: relayed by target socket id ---
  socket.on("client-ready", () => {
    const entry = socketUserMap.get(socket.id);
    if (entry) socket.to(roomName(entry.meetingNoId)).emit("client-ready", { fromSocketId: socket.id });
  });

  socket.on("offer", ({ offer, to }) => {
    io.to(to).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    io.to(to).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  // --- In-meeting state ---
  socket.on("chat-message", ({ message }) => {
    const entry = socketUserMap.get(socket.id);
    if (entry) socket.to(roomName(entry.meetingNoId)).emit("chat-message", { message });
  });

  socket.on("media-state", ({ isMuted, isVideoOff }) => {
    const entry = socketUserMap.get(socket.id);
    if (entry) {
      socket
        .to(roomName(entry.meetingNoId))
        .emit("media-state", { userId: entry.userId, isMuted, isVideoOff });
    }
  });

  // --- Recording lifecycle (host-controlled, both sides record) ---
  socket.on("recording-start", async () => {
    const entry = socketUserMap.get(socket.id);
    if (!entry?.isHost || recorder.isRecording(entry.meetingNoId)) return;
    const recorderIds = participantsIn(entry.meetingNoId).map((p) => p.id);
    await recorder.startRecording(entry.meetingNoId, entry.meetingId, recorderIds);
    io.to(roomName(entry.meetingNoId)).emit("recording-started");
  });

  socket.on("recording-stop", async () => {
    const entry = socketUserMap.get(socket.id);
    if (!entry?.isHost || !recorder.isRecording(entry.meetingNoId)) return;
    io.to(roomName(entry.meetingNoId)).emit("recording-stopped");
    await recorder.stopRecording(entry.meetingNoId);
  });

  socket.on("recording-uploaded", () => {
    const entry = socketUserMap.get(socket.id);
    if (entry) recorder.confirmUploaded(entry.meetingNoId, entry.userId);
  });

  // --- Meeting lifecycle ---
  socket.on("end-meeting", async () => {
    const entry = socketUserMap.get(socket.id);
    if (entry?.isHost) await endMeeting(entry);
  });

  socket.on("disconnect", async () => {
    const entry = socketUserMap.get(socket.id);
    if (!entry) return;
    socketUserMap.delete(socket.id);

    try {
      await prisma.participant.updateMany({
        where: { userId: entry.userId, meetingNoId: entry.meetingNoId },
        data: { hasJoined: false, leftAt: new Date() },
      });

      io.to(roomName(entry.meetingNoId)).emit(
        "participants-updated",
        participantsIn(entry.meetingNoId)
      );

      // Host vanishing (tab close, crash) ends the meeting for everyone and
      // still flushes any active recording into the merge pipeline.
      if (entry.isHost) await endMeeting(entry);
    } catch (err) {
      console.error("Error handling disconnect:", err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
