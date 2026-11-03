import express from "express";
import { createMeeting, getMeetingById, getMeetingHistory, getStorageUsage, joinMeeting } from "../controllers/meetingController.js";

const router = express.Router();

router.post("/create", createMeeting);
router.get("/history/:userId", getMeetingHistory);
router.get("/storage/:userId", getStorageUsage);
router.post("/join", joinMeeting);
router.get("/details/:meetingId", getMeetingById);


export default router;