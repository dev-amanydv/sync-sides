

"use client";

import { useState, useEffect } from "react";

export default function PreviewPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [meetingId, setMeetingId] = useState("");

    useEffect(() => {
    const storedMeetingId = localStorage.getItem("meetingId");
    if (storedMeetingId) setMeetingId(storedMeetingId);
    }, []);

  const handleLoad = () => {
    setVideoUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recordings/${meetingId}`);
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Preview Merged Video</h1>

      <div className="mb-4 space-y-2">
        <input
          className="border px-3 py-2 rounded w-full"
          value={meetingId}
          onChange={(e) => setMeetingId(e.target.value)}
          placeholder="Meeting ID"
        />
        <button
          onClick={handleLoad}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Load Video
        </button>
      </div>

      {videoUrl && (
        <video
          controls
          className="mt-4 w-full max-w-3xl"
          src={videoUrl}
        />
      )}
    </main>
  );
}