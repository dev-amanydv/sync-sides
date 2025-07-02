import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { mergeChunksToFile } from "../utils/ffmpegMerge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, "..", "..");

ffmpeg.setFfmpegPath(ffmpegPath as string);

const isValidWebm = async (filePath: string): Promise<boolean> => {
  const hasStream = await new Promise<boolean>((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(false);
      const hasVideo = metadata.streams?.some(
        (s) => s.codec_type === "video" && s.codec_name
      );
      resolve(hasVideo);
    });
  });

  if (!hasStream) return false;

  return new Promise<boolean>((resolve) => {
    let hasError = false;

    const command = ffmpeg(filePath)
      .format("null")
      .output("-")
      .on("stderr", (line) => {
        if (line.includes("Invalid data") || line.includes("EBML") || line.includes("parsing failed")) {
          hasError = true;
        }
      })
      .on("end", () => resolve(!hasError))
      .on("error", () => resolve(false))
      .run();
  });
};

export const mergeChunks = async (req: Request, res: Response): Promise<void> => {
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

    const chunkFilesInitial = fs
        .readdirSync(userDir)
        .filter(file => file.endsWith(".webm"))
        .sort((a, b) => {
            const aIndex = parseInt(a.split("-")[1]);
            const bIndex = parseInt(b.split("-")[1]);
            return aIndex - bIndex
        })
        .map(file => path.join(userDir, file))
        .filter(file => fs.statSync(file).size > 1024 * 1024); // Only keep chunks >1MB

    const validityChecks = await Promise.all(
      chunkFilesInitial.map(async (file) => ({
        file,
        valid: await isValidWebm(file),
      }))
    );

    console.log("Validation Results:", validityChecks);

    const chunkFiles = validityChecks
      .filter(result => result.valid)
      .map(result => result.file);

    if (chunkFiles.length === 0){
        res.status(400).json({
            error: "No chunks to merge"
        })
        return;
    }

    if (chunkFiles.length < 2) {
      res.status(400).json({
        error: "Not enough valid chunks to merge"
      });
      return;
    }

    const mergedPath = path.join(mergedDir, `${meetingId}-${userId}-merged.webm`);

    console.log("Chunks being merged:", chunkFiles);

    mergeChunksToFile(
      chunkFiles,
      mergedPath,
      () => {
        res.status(200).json({
          message: "Chunks merged successfully",
          output: `/merged/${meetingId}-${userId}-merged.webm`
        });
      },
      (err) => {
        console.log("Merge Error: ", err);
        res.status(500).json({
          error: "Merging failed"
        });
      }
    );
}