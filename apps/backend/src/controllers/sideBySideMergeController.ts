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

export const mergeSideBySide = (req: Request, res: Response): void => {
    const { meetingId, userA, userB } = req.body;

    if (!meetingId || !userA || !userB){
        res.status(400).json({
            error: "Missing meetingId or user IDs"
        })
        return ;
    }

    const mergedDir = path.join(rootPath, "merged");
    const outputPath = path.join(mergedDir, `${meetingId}-final.mp4`);
    const userAPath = path.join(mergedDir, `${meetingId}-${userA}-merged.webm`);
    const userBPath = path.join(mergedDir, `${meetingId}-${userB}-merged.webm`);

    if (!fs.existsSync(userAPath) || !fs.existsSync(userBPath)){
        res.status(404).json({
            error: "Merged files for one or both users not found"
        })
        return;
    }

    ffmpeg()
        .input(userAPath)
        .input(userBPath)
        .complexFilter([
            '[0:v]scale=1280:720[va]',
            '[1:v]scale=1280:720[vb]',
            '[va][vb]hstack=inputs=2[v]',
            '[0:a][1:a]amix=inputs=2[a]'
        ])
        .outputOptions(['-map [v]', '-map [a]', '-c:v libx264', '-c:a aac'])
        .on("end", () => {
            res.status(200).json({
                message: "Final side-by-side merge completed",
                output: `/merged/${meetingId}-final.mp4`
            })
        })
        .on('error', (err) => {
            console.log("Side-by-Side merge error: ", err);
            res.status(500).json({
                error: "Side-by-side merging failed"
            })
        })
        .save(outputPath);
};
