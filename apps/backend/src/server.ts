import express from "express";
import cors from "cors";
import path from "path"
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
import  prisma  from "hello-prisma";

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
    socketUserMap.set(socket.id, { userId: Number(user.userId), meetingNoId });

    try {
      await prisma.participant.upsert({
        where: {
          userId_meetingNoId: {
            userId: Number(user.userId),
            meetingNoId,
          },
        },
        update: {
          hasJoined: true,
        },
        create: {
          userId: Number(user.userId),
          meetingNoId,
          hasJoined: true,
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

      const joinedUsers = updatedParticipants.map((p) => {
        const entry = Array.from(socketUserMap.entries()).find(
          ([, value]) => value.userId === p.user.id && value.meetingNoId === meetingNoId
        );
        const socketId = entry?.[0];
        return {
          id: p.user.id,
          username: p.user.username,
          socketId,
        };
      });

      io.to(meetingNoId).emit("participants-updated", joinedUsers);
    } catch (err) {
      console.error("Error handling join-meeting:", err);
    }

    console.log(`👥 ${user.username} joined meeting ${meetingNoId}`);
  });

  socket.on("offer", ({ offer, to }) => {
    console.log("📨 Offer received from", socket.id, "to", to);
    io.to(to).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    console.log("📨 Answer received from", socket.id, "to", to);
    io.to(to).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    console.log("📨 ICE candidate from", socket.id, "to", to);
    io.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("start-call", ({ to }) => {
    const userData = socketUserMap.get(socket.id);
    const meetingNoId = userData?.meetingNoId;
    if (to === null && meetingNoId) {
      console.log("📞 Broadcasting start-call from", socket.id);
      socket.to(meetingNoId).emit("start-call", { to: socket.id });
    } else if (to) {
      console.log("📞 Direct start-call to", to);
      socket.to(to).emit("start-call", { to: socket.id });
    }
  });

  socket.on("disconnect", async () => {
    const userData = socketUserMap.get(socket.id);
    if (userData) {
      const { userId, meetingNoId } = userData;
      try {
        await prisma.participant.update({
          where: {
            userId_meetingNoId: {
              userId,
              meetingNoId,
            },
          },
          data: {
            hasJoined: false,
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

        const joinedUsers = updatedParticipants.map((p) => {
          const entry = Array.from(socketUserMap.entries()).find(
            ([, value]) => value.userId === p.user.id && value.meetingNoId === meetingNoId
          );
          const socketId = entry?.[0];
          return {
            id: p.user.id,
            username: p.user.username,
            socketId,
          };
        });

        io.to(meetingNoId).emit("participants-updated", joinedUsers);
      } catch (err) {
        console.error("Error handling disconnect:", err);
      }
      socketUserMap.delete(socket.id);
    }
    console.log("❌ A user disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server successfully started and is listening on http://localhost:${PORT}`);
});
