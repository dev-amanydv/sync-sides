import { Request, Response } from "express";
import  prisma  from "hello-prisma";

export const createMeeting = async (req: Request, res: Response): Promise<void> => {
  const { title, meetingId, hostId } = req.body;

  if (!title || !hostId) {
    res.status(400).json({ error: "Title and hostId are required" });
    return;
  }

  try {
    const meeting = await prisma.meeting.create({
      data: {
        title,
        meetingId,
        host: { connect: { id: hostId } },
      },
    });

    res.status(201).json({ message: "Meeting created", meeting });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMeetingHistory = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }

  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [
          { hostId: Number(userId) },
          { participants: { some: { id: Number(userId) } } },
        ],
      },
      include: {
        host: true,
        participants: true,
      },
    });

    res.status(200).json({ meetings });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const joinMeeting = async (req: Request, res: Response): Promise<void> => {
  const { meetingId, userId } = req.body;

  if (!meetingId || !userId) {
    res.status(400).json({ error: "Meeting ID and User ID are required" });
    return;
  }

  try {
    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        participants: {
          connect: { id: userId },
        },
      },
    });

    res.status(200).json({ message: "User added to meeting", meeting });
  } catch (error) {
    res.status(500).json({ error: "Failed to join meeting" });
  }
};

export const getMeetingById = async (req: Request, res: Response): Promise<void> => {
  const { meetingId } = req.params;

  if (!meetingId) {
    res.status(400).json({ error: "Meeting ID is required" });
    return;
  }

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: Number(meetingId) },
      include: {
        host: true,
        participants: true,
      },
    });

    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    res.status(200).json({ meeting });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch meeting" });
  }
};