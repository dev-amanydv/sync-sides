import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma.js";
import { mergeSideBySide, convertSingle } from "./ffmpeg.js";
import { storeRecording } from "./storage.js";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..");
export const UPLOADS_DIR = path.join(ROOT, "uploads");
export const MERGED_DIR = path.join(ROOT, "merged");

// FIFO queue: exactly one merge at a time so ffmpeg never runs concurrently
// on the 512MB instance. Jobs run in the background, never inside a request.
let queueTail: Promise<void> = Promise.resolve();

export const enqueueMerge = (meetingNoId: number, meetingId: string) => {
  queueTail = queueTail.then(() =>
    runMergeJob(meetingNoId, meetingId).catch(async (err) => {
      console.error(`Merge failed for meeting ${meetingId}:`, err);
      await prisma.recording
        .update({
          where: { meetingNoId },
          data: { status: "failed", error: String(err?.message ?? err).slice(0, 500) },
        })
        .catch(() => {});
      await fsp.rm(path.join(UPLOADS_DIR, meetingId), { recursive: true, force: true }).catch(() => {});
    })
  );
};

const chunkIndex = (name: string) => Number(name.match(/^chunk-(\d+)\.webm$/)?.[1] ?? NaN);

// MediaRecorder timeslice chunks of one continuous session form a single
// valid WebM stream when appended in order (only chunk 0 carries the EBML
// header), so a streamed byte-concat is enough for ffmpeg to read.
const concatChunks = async (userDir: string, outputFile: string): Promise<boolean> => {
  const files = (await fsp.readdir(userDir).catch(() => [] as string[]))
    .filter((f) => !Number.isNaN(chunkIndex(f)))
    .sort((a, b) => chunkIndex(a) - chunkIndex(b));
  if (files.length === 0) return false;

  const out = fs.createWriteStream(outputFile);
  try {
    for (const file of files) {
      // Chunks are small (~3s of video), so read each fully and write it with
      // backpressure. Piping the shared writable through stream.pipeline in a
      // loop leaks listeners, because its per-call cleanup only fires when the
      // destination closes — which end:false intentionally prevents.
      const data = await fsp.readFile(path.join(userDir, file));
      if (!out.write(data)) {
        await new Promise<void>((resolve) => out.once("drain", () => resolve()));
      }
    }
  } finally {
    out.end();
  }
  await new Promise<void>((resolve, reject) =>
    out.once("finish", () => resolve()).once("error", reject)
  );
  return true;
};

const runMergeJob = async (meetingNoId: number, meetingId: string) => {
  const meetingDir = path.join(UPLOADS_DIR, meetingId);
  await fsp.mkdir(MERGED_DIR, { recursive: true });

  const userDirs = (await fsp.readdir(meetingDir, { withFileTypes: true }).catch(() => []))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const sides: string[] = [];
  for (const userId of userDirs) {
    const concatFile = path.join(meetingDir, `${userId}.webm`);
    if (await concatChunks(path.join(meetingDir, userId), concatFile)) {
      sides.push(concatFile);
    }
  }

  if (sides.length === 0) {
    throw new Error("No recorded chunks found");
  }

  const outputFile = path.join(MERGED_DIR, `${meetingId}.mp4`);
  console.log(`Merging meeting ${meetingId} (${sides.length} side(s))...`);
  if (sides.length >= 2) {
    await mergeSideBySide(sides[0]!, sides[1]!, outputFile);
  } else {
    await convertSingle(sides[0]!, outputFile);
  }

  const bytes = (await fsp.stat(outputFile).catch(() => null))?.size ?? null;
  const stored = await storeRecording(outputFile);

  // Once R2 holds the merged video, the local chunks and (if offloaded) the
  // merged file are redundant. Clean them up in a finally so a failed DB write
  // can't leak them on disk — R2 already has the durable copy.
  try {
    await prisma.$transaction([
      prisma.recording.update({
        where: { meetingNoId },
        data: { status: "available", url: stored.url, error: null, bytes },
      }),
      prisma.meeting.update({
        where: { id: meetingNoId },
        data: { recorded: true, mergedPath: stored.url },
      }),
    ]);
  } finally {
    await fsp.rm(meetingDir, { recursive: true, force: true }).catch(() => {});
    if (stored.offloaded) {
      await fsp.rm(outputFile, { force: true }).catch(() => {});
    }
  }
  console.log(`Recording ready for meeting ${meetingId}: ${stored.url}`);
};
