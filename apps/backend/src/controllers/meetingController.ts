import { Request, Response } from "express";
import  prisma  from "hello-prisma";
import dns from "dns";

const isConnectedToInternet = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    dns.lookup("google.com", (err) => {
      resolve(!err);
    });
  });
};

export const createMeeting = async (req: Request, res: Response): Promise<void> => {
  const { title, description, meetingId, hostId } = req.body;

  if (!title || !hostId) {
    res.status(400).json({ error: "Title and hostId are required" });
    return;
  }

  if (!(await isConnectedToInternet())) {
    res.status(503).json({ error: "No internet connection" });
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
    console.log("Error creating meeting: ", error)
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMeetingHistory = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }

  if (!(await isConnectedToInternet())) {
    console.log("no internet")
    res.status(503).json({ error: "No internet connection" });
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
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    res.status(200).json({ meetings });
  } catch (error) {
    console.log("Error getting history: ", error)
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const joinMeeting = async (req: Request, res: Response): Promise<void> => {
  console.log("recieved request for joining")
  const { meetingId, userId } = req.body;
  console.log("meetingId: ", meetingId, " userId joined: ", userId)

  if (!meetingId || !userId) {
    res.status(400).json({ error: "Meeting ID and User ID are required" });
    return;
  }

  if (!(await isConnectedToInternet())) {
    res.status(503).json({ error: "No internet connection" });
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
    console.log("Error joining meeting: ", error)
    res.status(500).json({ error: "Failed to join meeting" });
  }
};

export const getMeetingById = async (req: Request, res: Response): Promise<void> => {
  const { meetingId } = req.params;
console.log("requesthitted with meetingId: ", meetingId)
  if (!meetingId) {
    res.status(400).json({ error: "Meeting ID is required" });
    return;
  }

  if (!(await isConnectedToInternet())) {
    console.log("no internet ")
    res.status(503).json({ error: "No internet connection" });
    return;
  }

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId: meetingId },
      include: {
        host: true,
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
    console.log("Error getting meeting detailes: ", error);
    res.status(500).json({ error: "Failed to fetch meeting" });
  }
};