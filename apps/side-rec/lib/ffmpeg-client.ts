declare global {
    interface Window {
      FFmpeg: any;
    }
  }
  
  let ffmpeg: any = null;
  let ffmpegLoadingPromise: Promise<any> | null = null;
  
  const fetchFile = async (file: Blob | string): Promise<Uint8Array> => {
    let response: Response;
    if (typeof file === 'string') {
      response = await fetch(file);
    } else {
      const objectURL = URL.createObjectURL(file);
      response = await fetch(objectURL);
      URL.revokeObjectURL(objectURL);
    }
    const data = await response.arrayBuffer();
    return new Uint8Array(data);
  };
  
  export const loadFFmpeg = (): Promise<any> => {
    if (ffmpeg) {
      return Promise.resolve(ffmpeg);
    }
    if (ffmpegLoadingPromise) {
      return ffmpegLoadingPromise;
    }
  
    ffmpegLoadingPromise = new Promise(async (resolve, reject) => {
      try {
        // Step 1: Poll and wait for window.FFmpeg to be available from the script tag.
        let attempts = 0;
        const maxAttempts = 150; // Wait for up to 15 seconds
        const interval = setInterval(async () => {
          if (window.FFmpeg) {
            clearInterval(interval);
            console.log("SUCCESS: window.FFmpeg object is now available.");
            
            try {
              // Step 2: Initialize the library with explicit paths.
              const { FFmpeg } = window;
              ffmpeg = new FFmpeg();
              const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
              await ffmpeg.load({
                coreURL: `${baseURL}/ffmpeg-core.js`,
                wasmURL: `${baseURL}/ffmpeg-core.wasm`,
              });
  
              console.log("SUCCESS: FFmpeg core has been loaded.");
              resolve(ffmpeg);
            } catch (e) {
              console.error("ERROR: Failed to load FFmpeg core.", e);
              reject(e);
            }
  
          } else {
            attempts++;
            if (attempts > maxAttempts) {
              clearInterval(interval);
              reject(new Error("FFmpeg script loaded, but window.FFmpeg not found after 15s."));
            }
          }
        }, 100);
  
      } catch (error) {
        ffmpegLoadingPromise = null;
        reject(error);
      }
    });
  
    return ffmpegLoadingPromise;
  };
  
  export const mergeVideosClientSide = async (
    localVideoBlob: Blob,
    remoteVideoURL: string
  ): Promise<Blob> => {
    const ffmpegInstance = await loadFFmpeg();
  
    await ffmpegInstance.writeFile('local.webm', await fetchFile(localVideoBlob));
    await ffmpegInstance.writeFile('remote.webm', await fetchFile(remoteVideoURL));
  
    const command = [
      '-i', 'local.webm',
      '-i', 'remote.webm',
      '-filter_complex', '[0:v][1:v]hstack=inputs=2[v];[0:a][1:a]amerge=inputs=2[a]',
      '-map', '[v]',
      '-map', '[a]',
      '-ac', '2',
      'output.mp4'
    ];
  
    await ffmpegInstance.exec(command);
    const data = await ffmpegInstance.readFile('output.mp4');
    return new Blob([data.buffer], { type: 'video/mp4' });
  };
  