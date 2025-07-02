import { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, "..", "..");

export const getMergedRecording = ( req: Request, res: Response): void => {
    const { meetingId } = req.params;
    
    if (!meetingId){
        res.status(400).json({
            error: "missing meetingId"
        })
        return;
    }

    const mergedDir = path.join(rootPath, "merged");
    const mergedFile = path.join(mergedDir, `${meetingId}-final.mp4`);

    if (!fs.existsSync(mergedFile)){
        res.status(400).json({
            error: "Merged file not found"
        })
        return ;
    }
    res.sendFile(mergedFile, {
        headers: {
          "Content-Type": "video/mp4",
          "Cross-Origin-Resource-Policy": "cross-origin"
        }
      });
};