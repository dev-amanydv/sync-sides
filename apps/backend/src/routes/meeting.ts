import express from "express";
import { createMeeting, getMeetingById, getMeetingHistory, joinMeeting } from "../controllers/meetingController.js";

const router = express.Router();

router.post("/create", createMeeting);
router.get("/history", getMeetingHistory);
router.get("/join", joinMeeting);
router.get("/details", getMeetingById);


export default router;