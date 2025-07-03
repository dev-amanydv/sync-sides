"use client";

import { useEffect, useRef, useState } from "react";

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [chunkStatuses, setChunkStatuses] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkIndexRef = useRef(0);

  const [meetingId, setMeetingId] = useState("");
  const [userId, setUserId] = useState("");

    useEffect(() => {
    const storedMeetingId = localStorage.getItem("meetingId");
    const storedUserId = localStorage.getItem("userId");
    if (storedMeetingId) setMeetingId(storedMeetingId);
    if (storedUserId) setUserId(storedUserId);
    }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRecording]);

  useEffect(() => {
    const interval = setInterval(() => {
      const tracks = streamRef.current?.getTracks() || [];
      const ended = tracks.some((t) => t.readyState === "ended");
      if (ended && isRecording) {
        console.warn("🚨 One or more media tracks ended unexpectedly.");
        stopRecording();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    setStatus("Requesting permissions...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setStatus("Recording...");

      const options = { mimeType: "video/webm; codecs=vp8,opus" };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.onstop = () => {
        console.log("⛔ MediaRecorder stopped");
        setStatus("MediaRecorder stopped unexpectedly");
      };

      recorder.onerror = (e) => {
        console.error("Recorder error:", e.error);
      };

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const chunk = event.data;
          const formData = new FormData();
          formData.append("chunk", chunk, `chunk-${chunkIndexRef.current}.webm`);
          formData.append("meetingId", meetingId);
          formData.append("userId", userId);
          formData.append("chunkIndex", chunkIndexRef.current.toString());

          try {
            await fetch("http://localhost:4000/api/upload", {
              method: "POST",
              body: formData,
            });
            console.log(`Chunk ${chunkIndexRef.current} uploaded.`);
            chunkIndexRef.current += 1;
            setChunkStatuses((prev) => [
              ...prev,
              `✅ Chunk ${chunkIndexRef.current - 1} uploaded successfully`
            ]);
            console.log("🔍 Chunk uploaded. Size:", chunk.size);
          } catch (err) {
            console.error("Upload failed", err);
          }
        }
      };

      recorder.start(10000); // Collect chunks every 5 seconds
      setIsRecording(true);
    } catch (err) {
      console.error("Could not start recording", err);
      setStatus("Error starting recording");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    // Flush the last chunk before stopping
    mediaRecorderRef.current.requestData();

    // Wait briefly to ensure flush completes
    setTimeout(() => {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setStatus("Recording stopped");
    }, 500);
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Record Meeting</h1>

      <p className="mb-4 text-gray-700">Status: {status}</p>

      <div className="mb-4">
        <h2 className="font-medium">Chunk Upload Status</h2>
        <ul className="text-sm text-gray-600 list-disc list-inside max-h-40 overflow-y-auto border p-2 rounded bg-gray-50">
          {chunkStatuses.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="space-x-4">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Stop Recording
        </button>
      </div>
    </main>
  );
}
