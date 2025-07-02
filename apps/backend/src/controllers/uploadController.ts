import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, "..", "..");

interface UploadRequest extends Request {
 file: Express.Multer.File;
 body: {
    meetingId: string,
    userId: string,
    chunkIndex: string
 }
}

export const uploadChunk = (req: Request, res: Response): void => {
    const { meetingId, userId, chunkIndex } = req.body;

    if (!req.file || !meetingId || !userId || chunkIndex === undefined){
        res.status(400).json({
            error: "missing required data"
        });
        return;
    }

    const chunkNum = Number(chunkIndex);
    if (isNaN(chunkNum)){
        res.status(400).json({
            error: "invalid chunk index"
        });
        return;
    }

    const uploadDir = path.join(rootPath, "uploads", meetingId, userId);
    fs.mkdirSync(uploadDir, { recursive: true });

    const chunkPath = path.join(uploadDir, `chunk-${chunkNum}.webm`);
    fs.writeFileSync(chunkPath, req.file.buffer);

    res.status(200).json({
        message: "Chunk uploaded successfully",
        meetingId,
        userId,
        chunkIndex: chunkNum
    });

}