"use client";

// Owns the local camera/mic stream. The stream is acquired once in the lobby
// and carried straight into the meeting — no re-acquire on join, so the
// lobby → live transition is instant.

import { useCallback, useEffect, useRef, useState } from "react";

const CONSTRAINTS = (cameraId?: string, micId?: string): MediaStreamConstraints => ({
  video: {
    deviceId: cameraId ? { exact: cameraId } : undefined,
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: {
    deviceId: micId ? { exact: micId } : undefined,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});

export interface MediaDevicesState {
  stream: MediaStream | null;
  cameras: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];
  cameraId: string | undefined;
  micId: string | undefined;
  error: string | null;
  selectCamera: (id: string) => void;
  selectMic: (id: string) => void;
}

export function useMediaDevices(): MediaDevicesState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState<string>();
  const [micId, setMicId] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const enumerate = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setCameras(devices.filter((d) => d.kind === "videoinput"));
    setMics(devices.filter((d) => d.kind === "audioinput"));
  }, []);

  const acquire = useCallback(
    async (cam?: string, mic?: string) => {
      try {
        const next = await navigator.mediaDevices.getUserMedia(CONSTRAINTS(cam, mic));
        // Swap in the new stream, stopping the previous one.
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        streamRef.current = next;
        setStream(next);
        setError(null);
        await enumerate();
      } catch (err) {
        const e = err as DOMException;
        setError(
          e.name === "NotAllowedError"
            ? "Camera and microphone access was denied. Allow permissions and reload."
            : e.name === "NotFoundError"
              ? "No camera or microphone found."
              : "Could not access your camera or microphone."
        );
      }
    },
    [enumerate]
  );

  // Acquire once on mount.
  useEffect(() => {
    acquire();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCamera = useCallback(
    (id: string) => {
      setCameraId(id);
      acquire(id, micId);
    },
    [acquire, micId]
  );

  const selectMic = useCallback(
    (id: string) => {
      setMicId(id);
      acquire(cameraId, id);
    },
    [acquire, cameraId]
  );

  return { stream, cameras, mics, cameraId, micId, error, selectCamera, selectMic };
}
