import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { presignRecording } from "../services/storage.js";

// Redirects to a freshly presigned R2 URL for the meeting's recording. The DB
// stores this stable endpoint as the recording URL so playback/download/share
// links never expire, while the object itself stays private on R2.
export const streamRecordingFile = async (req: Request, res: Response): Promise<void> => {
  const { meetingId } = req.params;
  const download = req.query.download ? `${String(meetingId)}.mp4` : undefined;
  try {
    const signed = await presignRecording(String(meetingId), download);
    if (!signed) {
      res.status(404).json({ error: "Recording not available" });
      return;
    }
    res.redirect(302, signed);
  } catch (error) {
    console.error("Error presigning recording:", error);
    res.status(500).json({ error: "Failed to load recording" });
  }
};

// Recording status/URL for a meeting — polled by the post-meeting screen.
export const getRecording = async (req: Request, res: Response): Promise<void> => {
  const { meetingId } = req.params;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId: String(meetingId) },
      include: { recording: true },
    });

    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    if (!meeting.recording) {
      res.status(200).json({ recording: null });
      return;
    }

    const { status, url, durationMs, updatedAt } = meeting.recording;
    res.status(200).json({ recording: { status, url, durationMs, updatedAt } });
  } catch (error) {
    console.error("Error fetching recording:", error);
    res.status(500).json({ error: "Failed to fetch recording" });
  }
};
