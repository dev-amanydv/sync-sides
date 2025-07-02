import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// No longer need fluent-ffmpeg for this simple concatenation
// import ffmpeg from "fluent-ffmpeg"; 
// import ffmpegPath from "ffmpeg-static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, "..", "..");

export const mergeChunks = async (req: Request, res: Response): Promise<void> => {
    const { meetingId, userId } = req.body;
    if (!meetingId || !userId) {
        res.status(400).json({
            error: "Missing meetingId or userId"
        });
        return;
    }

    const userDir = path.join(rootPath, "uploads", meetingId, userId);
    const mergedDir = path.join(rootPath, "merged");
    fs.mkdirSync(mergedDir, { recursive: true });

    // Check if the directory exists and is accessible
    if (!fs.existsSync(userDir)) {
        res.status(404).json({
            error: "Upload directory not found for the user."
        });
        return;
    }

    const chunkFiles = fs
        .readdirSync(userDir)
        .filter(file => file.startsWith("chunk-") && file.endsWith(".webm"))
        .sort((a, b) => {
            const aIndex = parseInt(a.split("-")[1]);
            const bIndex = parseInt(b.split("-")[1]);
            return aIndex - bIndex;
        })
        .map(file => path.join(userDir, file));

    if (chunkFiles.length === 0) {
        res.status(400).json({
            error: "No chunks found to merge."
        });
        return;
    }

    const mergedPath = path.join(mergedDir, `${meetingId}-${userId}-merged.webm`);
    const writeStream = fs.createWriteStream(mergedPath);

    console.log(`Starting concatenation for ${chunkFiles.length} chunks...`);

    // Sequentially read and append each chunk to the write stream
    for (const chunkFile of chunkFiles) {
        try {
            const data = fs.readFileSync(chunkFile);
            writeStream.write(data);
            console.log(`Appended ${path.basename(chunkFile)}`);
        } catch (err) {
            console.error(`Error reading chunk ${chunkFile}:`, err);
            // It might be best to stop if a chunk is unreadable
            writeStream.end(); // Close the stream
            res.status(500).json({ error: `Failed to read chunk: ${path.basename(chunkFile)}` });
            return;
        }
    }
    
    writeStream.end();

    writeStream.on('finish', () => {
        console.log("All chunks concatenated successfully.");
        res.status(200).json({
            message: "Chunks merged successfully",
            output: `/merged/${meetingId}-${userId}-merged.webm`
        });
    });

    writeStream.on('error', (err) => {
        console.error("Error writing concatenated file:", err);
        res.status(500).json({
            error: "Merging failed during file write."
        });
    });
}