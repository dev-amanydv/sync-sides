import express from "express";
import { createMeeting, getMeetingById, getMeetingHistory, joinMeeting } from "../controllers/meetingController.js";

const router = express.Router();

router.post("/create", createMeeting);
router.get("/history/:userId", getMeetingHistory);
router.post("/join", joinMeeting);
router.get("/details/:meetingId", getMeetingById);


export default router;