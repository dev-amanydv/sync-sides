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

io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  socket.on("join-meeting", ({ meetingId, user }) => {
    socket.join(meetingId);
    io.to(meetingId).emit("user-joined", user);
    console.log(`👥 ${user.username} joined meeting ${meetingId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server successfully started and is listening on http://localhost:${PORT}`);
});
