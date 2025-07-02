import express from "express";
import { getMergedRecording } from "../controllers/recordingController";

const router = express.Router();

router.get("/:meetingId", getMergedRecording);

export default router;

