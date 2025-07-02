import path from "path";
import ffmpeg from "fluent-ffmpeg";

export const mergeChunksToFile = (
    inputFiles: string[],
    outputFile: string,
    onSuccess: () => void,
    onError: (err: Error) => void
  ) => {
    const command = ffmpeg();
  
    inputFiles.forEach(file => {
      command.input(file);
    });
  
    command
      .on("end", onSuccess)
      .on("error", onError)
      .mergeToFile(outputFile, path.join(process.cwd(), "temp"));
  };

  export const mergeSideBySideToFile = (
    fileA: string,
    fileB: string,
    outputFile: string,
    onSuccess: () => void,
    onError: (err: Error) => void
  ) => {
    ffmpeg()
      .input(fileA)
      .input(fileB)
      .complexFilter([
        "[0:v]scale=1280:720[va]",
        "[1:v]scale=1280:720[vb]",
        "[va][vb]hstack=inputs=2[v]",
        "[0:a][1:a]amix=inputs=2[a]",
      ])
      .outputOptions(["-map [v]", "-map [a]", "-c:v libx264", "-c:a aac"])
      .on("end", onSuccess)
      .on("error", onError)
      .save(outputFile);
  };