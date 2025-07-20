import express from "express";
import { createMeeting, getMeetingById, getMeetingHistory, joinMeeting, saveRecording } from "../controllers/meetingController.js";

const router = express.Router();

router.post("/create", createMeeting);
router.get("/history/:userId", getMeetingHistory);
router.post("/join", joinMeeting);
router.get("/details/:meetingId", getMeetingById);
router.post("/recording", saveRecording)


export default router;