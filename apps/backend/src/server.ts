import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import uploadRoutes from "./routes/upload.js";
import mergeRoutes from "./routes/merge.js";
import recordingRoutes from "./routes/recordings.js";
import sideBySideRoutes from "./routes/sideBySideMerge.js";
import meetingRoutes from "./routes/meeting.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import http from "http";
import { Server } from "socket.io";
import { PrismaClient, User, Participant } from "@prisma/client";
const prisma = new PrismaClient();
dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }));
// app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, "..", "uploads")));
app.use('/merged', express.static(path.join(__dirname, "..", "merged")));

app.use('/api/auth', authRoutes);
app.use('/api/meeting', meetingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/merge', mergeRoutes);
app.use('/api/recordings', recordingRoutes);
app.use("/api/merge/side-by-side", sideBySideRoutes);


app.get('/', (req, res) => {
    res.send("sideRec backend is running")
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const socketUserMap = new Map();
io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

socket.on("join-meeting", async ({ meetingNoId, user }) => {
  socket.join(meetingNoId);
  socketUserMap.set(socket.id, { userId: Number(user.userId), meetingNoId, userEmail: user.email });

  try {

    await prisma.user.update({
      where: { id: Number(user.userId) },
      data: {
        fullname: user.name,
        email: user.email,
      },
    });

    console.log(`🔧 Upserting participant userId: ${user.userId}, meetingNoId: ${meetingNoId}`);

    await prisma.participant.upsert({
      where: {
        userId_meetingNoId: {
          userId: Number(user.userId),
          meetingNoId,
        },
      },
      update: {
        hasJoined: true,
        joinedAt: new Date()
      },
      create: {
        userId: Number(user.userId),
        meetingNoId,
        hasJoined: true,
        joinedAt: new Date()
      },
    });

    const updatedParticipants = await prisma.participant.findMany({
      where: {
        meetingNoId,
        hasJoined: true,
      },
      include: {
        user: true,
      },
    });
    
    const joinedUsers = updatedParticipants.map((p: Participant & { user: User }) => {
      const entry = Array.from(socketUserMap.entries()).find(
        ([, value]) => value.userId === p.user.id && value.meetingNoId === meetingNoId
      );
      const socketId = entry?.[0];
      return {
        id: p.user.id,
        email: p.user.email,
        name: p.user.fullname,
        socketId,
      };
    });

    io.to(meetingNoId).emit("participants-updated", joinedUsers);
    console.log(`👥 ${user.email} joined meeting ${meetingNoId}`);
  } catch (err) {
    console.error("❌ Error handling join-meeting:", err);
  }
});

socket.on("client-ready", ({ meetingNoId, fromSocketId }) => {
  socket.to(meetingNoId).emit("client-ready", { fromSocketId });
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

  socket.on("chat-message", ({ message }) => {
    const userData = socketUserMap.get(socket.id);
    if (userData) {
      const { meetingNoId } = userData;
      socket.to(meetingNoId).emit("chat-message", { message });
    }
  });
  
  socket.on("hand-raised", ({ userId, isHandRaised }) => {
    const userData = socketUserMap.get(socket.id);
    if (userData) {
      const { meetingNoId } = userData;
      socket.to(meetingNoId).emit("hand-raised", { userId, isHandRaised });
    }
  });

  socket.on("participant-muted", ({ userId, isMuted }) => {
    const userData = socketUserMap.get(socket.id);
    if (userData) {
      const { meetingNoId } = userData;
      socket.to(meetingNoId).emit("participant-muted", { userId, isMuted });
    }
  });

  socket.on("participant-video-toggled", ({ userId, isVideoOff }) => {
    const userData = socketUserMap.get(socket.id);
    if (userData) {
      const { meetingNoId } = userData;
      socket.to(meetingNoId).emit("participant-video-toggled", { userId, isVideoOff });
    }
  });


  socket.on("disconnect", async () => {
    const userData = socketUserMap.get(socket.id);
    if (userData) {
      const { userId, meetingNoId } = userData;
      
      socketUserMap.delete(socket.id);
      
      try {
        await prisma.participant.updateMany({
          where: {
            userId: userId,
            meetingNoId: meetingNoId,
          },
          data: {
            hasJoined: false,
            leftAt: new Date()
          },
        });

        const remainingParticipants = await prisma.participant.findMany({
          where: {
            meetingNoId,
            hasJoined: true,
          },
          include: {
            user: true,
          },
        });
        
        const joinedUsers = remainingParticipants.map((p: Participant & { user: User }) => {
          const entry = Array.from(socketUserMap.entries()).find(
            ([, value]) => value.userId === p.user.id && value.meetingNoId === meetingNoId
          );
          const socketId = entry?.[0];
          return {
            id: p.user.id,
            email: p.user.email,
            name: p.user.fullname, 
            socketId,
          };
        });
         
        io.to(meetingNoId).emit("participants-updated", joinedUsers);

        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingNoId },
          select: { hostId: true }
        });

        if (userId === meeting?.hostId) {
          const hostParticipant = await prisma.participant.findFirst({
            where: { userId, meetingNoId },
            select: { joinedAt: true, leftAt: true }
          });
          
          if (hostParticipant?.joinedAt && hostParticipant?.leftAt) {
            const durationInMs =
              new Date(hostParticipant.leftAt).getTime() -
              new Date(hostParticipant.joinedAt).getTime();

            await prisma.meeting.update({
              where: { id: meetingNoId },
              data: { durationMs: durationInMs }
            });

            io.to(meetingNoId).emit("meeting-ended", { durationMs: durationInMs });
          }
        }
      } catch (err) {
        console.error("❌ Error handling disconnect:", err);
      }
    }
    console.log("❌ A user disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server successfully started and is listening on http://localhost:${PORT}`);
});