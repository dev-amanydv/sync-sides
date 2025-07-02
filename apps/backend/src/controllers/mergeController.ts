import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, "..", "..");

ffmpeg.setFfmpegPath(ffmpegPath as string);

export const mergeChunks = (req: Request, res: Response): void => {
    const { meetingId, userId} = req.body;
    if (!meetingId || !userId){
        res.status(400).json({
            error: "Missing meetingId or userId"
        });
        return;
    }

    const userDir = path.join(rootPath, "uploads", meetingId, userId);
    const mergedDir = path.join(rootPath, "merged");
    fs.mkdirSync(mergedDir, { recursive: true });

    const chunkFiles = fs
        .readdirSync(userDir)
        .filter(file => file.endsWith(".webm"))
        .sort((a, b) => {
            const aIndex = parseInt(a.split("-")[1]);
            const bIndex = parseInt(b.split("-")[1]);
            return aIndex - bIndex
        })
        .map(file => path.join(userDir, file));

        if (chunkFiles.length === 0){
            res.status(400).json({
                error: "No chunks to merge"
            })
            return;
        }

        const mergedPath = path.join(mergedDir, `${meetingId}-${userId}-merged.webm`);

        const command = ffmpeg();

        chunkFiles.forEach(chunk => { command.input(chunk) });

        command
            .on("end", () => {
                res.status(200).json({
                    message: "Chunks merged successfully",
                    output: `/merged/${meetingId}-${userId}-merged.webm`
                })
            })
            .on("error", (err) => {
                console.log("Merge Error: ", err);
                res.status(500).json({
                    error: "Merging failed"
                })
            })
            .mergeToFile(mergedPath, path.join(rootPath, "temp"))
}