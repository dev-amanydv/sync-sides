import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  const { meetingId, userId, rating, comment } = req.body;

  const numericRating = Number(rating);
  if (!meetingId || !userId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400).json({ error: "meetingId, userId and a rating of 1-5 are required" });
    return;
  }

  try {
    const meeting = await prisma.meeting.findUnique({ where: { meetingId } });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    const feedback = await prisma.feedback.upsert({
      where: {
        userId_meetingNoId: { userId: Number(userId), meetingNoId: meeting.id },
      },
      update: { rating: numericRating, comment: comment || null },
      create: {
        userId: Number(userId),
        meetingNoId: meeting.id,
        rating: numericRating,
        comment: comment || null,
      },
    });

    res.status(200).json({ feedback });
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback" });
  }
};
