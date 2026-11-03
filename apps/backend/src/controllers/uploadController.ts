import { Request, Response } from "express";

// Multer's diskStorage has already streamed the chunk to
// uploads/<meetingId>/<userId>/chunk-<n>.webm by the time we get here.
export const uploadChunk = (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: "missing chunk" });
    return;
  }
  res.status(200).json({ ok: true });
};
