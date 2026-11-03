import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { UPLOADS_DIR } from "../services/recordingPipeline.js";
import { uploadChunk } from "../controllers/uploadController.js";

const router = express.Router();

const SAFE_MEETING_ID = /^[A-Za-z0-9_-]+$/;
const SAFE_NUMBER = /^\d+$/;

// Chunks stream straight to disk — the old memoryStorage buffered every
// chunk fully in RAM, which is what pressured the 512MB instance.
// NOTE: the client must append meetingId/userId/chunkIndex to the FormData
// BEFORE the file so they're parsed by the time the file part arrives.
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const { meetingId, userId } = req.body;
    if (!SAFE_MEETING_ID.test(meetingId ?? "") || !SAFE_NUMBER.test(userId ?? "")) {
      cb(new Error("Invalid meetingId or userId"), "");
      return;
    }
    const dir = path.join(UPLOADS_DIR, meetingId, userId);
    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },
  filename: (req, _file, cb) => {
    const { chunkIndex } = req.body;
    if (!SAFE_NUMBER.test(chunkIndex ?? "")) {
      cb(new Error("Invalid chunkIndex"), "");
      return;
    }
    cb(null, `chunk-${Number(chunkIndex)}.webm`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024, files: 1 },
});

router.post("/", upload.single("chunk"), uploadChunk);

export default router;
