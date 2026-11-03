import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// ffmpeg-static was a dependency before but never wired up, so production
// silently depended on a system ffmpeg binary that Render doesn't have.
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
}

// Every side is normalized to 640x360 @ 24fps before stacking. Two 360p
// decode buffers + one veryfast x264 encode on a single thread stays well
// under the 512MB limit of a free Render instance; fps normalization is also
// required for hstack since MediaRecorder produces variable-frame-rate webm.
const SIDE_SCALE =
  "scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2,fps=24";

const OUTPUT_OPTIONS = [
  "-c:v libx264",
  "-preset veryfast",
  "-crf 28",
  "-threads 1",
  "-c:a aac",
  "-b:a 96k",
  "-movflags +faststart",
];

export const mergeSideBySide = (fileA: string, fileB: string, outputFile: string) =>
  new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(fileA)
      .input(fileB)
      .complexFilter([
        `[0:v]${SIDE_SCALE}[va]`,
        `[1:v]${SIDE_SCALE}[vb]`,
        "[va][vb]hstack=inputs=2[v]",
        "[0:a][1:a]amix=inputs=2:duration=longest[a]",
      ])
      .outputOptions(["-map [v]", "-map [a]", ...OUTPUT_OPTIONS, "-shortest"])
      .on("end", () => resolve())
      .on("error", reject)
      .save(outputFile);
  });

// Fallback when only one side recorded anything (e.g. guest never joined).
export const convertSingle = (inputFile: string, outputFile: string) =>
  new Promise<void>((resolve, reject) => {
    ffmpeg(inputFile)
      .outputOptions([`-vf ${SIDE_SCALE}`, ...OUTPUT_OPTIONS])
      .on("end", () => resolve())
      .on("error", reject)
      .save(outputFile);
  });
