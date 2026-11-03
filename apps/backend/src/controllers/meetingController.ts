import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const createMeeting = async (req: Request, res: Response): Promise<void> => {
  const { title, description, meetingId, hostId } = req.body;

  if (!title || !hostId) {
    res.status(400).json({ error: "Title and hostId are required" });
    return;
  }

  try {
    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        meetingId,
        host: { connect: { id: Number(hostId) } },
      },
    });
    res.status(201).json({ message: "Meeting created", meeting });
  } catch (error) {
    console.error("Error creating meeting:", error);
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
          { participants: { some: { userId: Number(userId) } } },
        ],
      },
      include: {
        host: true,
        recording: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ meetings });
  } catch (error) {
    console.error("Error getting history:", error);
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
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId: meetingId },
    });

    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    await prisma.participant.upsert({
      where: {
        userId_meetingNoId: {
          userId: Number(userId),
          meetingNoId: meeting.id,
        },
      },
      update: { hasJoined: true },
      create: {
        userId: Number(userId),
        meetingNoId: meeting.id,
        hasJoined: true,
      },
    });

    res.status(200).json({ message: "User added to meeting" });
  } catch (error) {
    console.error("Error joining meeting:", error);
    res.status(500).json({ error: "Failed to join meeting" });
  }
};

// Total R2 storage (in bytes) occupied by the user's own meeting recordings.
// Storage is charged to the host, so we sum recordings for meetings they host.
export const getStorageUsage = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }

  try {
    const [agg, count] = await Promise.all([
      prisma.recording.aggregate({
        _sum: { bytes: true },
        where: { meeting: { hostId: Number(userId) }, status: "available" },
      }),
      prisma.recording.count({
        where: { meeting: { hostId: Number(userId) }, status: "available" },
      }),
    ]);
    res.status(200).json({ bytes: agg._sum.bytes ?? 0, recordings: count });
  } catch (error) {
    console.error("Error getting storage usage:", error);
    res.status(500).json({ error: "Failed to fetch storage usage" });
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
      where: { meetingId: meetingId },
      include: {
        host: true,
        recording: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    res.status(200).json({ meeting });
  } catch (error) {
    console.error("Error getting meeting details:", error);
    res.status(500).json({ error: "Failed to fetch meeting" });
  }
};
