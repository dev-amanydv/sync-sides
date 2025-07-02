import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mergeSideBySideToFile } from "../utils/ffmpegMerge";
import ffmpegPath from "ffmpeg-static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, "..", "..");

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

    mergeSideBySideToFile(
      userAPath,
      userBPath,
      outputPath,
      () => {
        res.status(200).json({
          message: "Final side-by-side merge completed",
          output: `/merged/${meetingId}-final.mp4`
        });
      },
      (err) => {
        console.log("Side-by-Side merge error: ", err);
        res.status(500).json({
          error: "Side-by-side merging failed"
        });
      }
    );
};
