import express from "express";
import { getRecording, streamRecordingFile } from "../controllers/recordingController.js";

const router = express.Router();

// Stable, non-expiring URL that 302-redirects to a presigned R2 object.
router.get("/file/:meetingId", streamRecordingFile);
router.get("/:meetingId", getRecording);

export default router;
