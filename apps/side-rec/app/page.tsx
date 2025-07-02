"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [meetingId, setMeetingId] = useState("");
  const [userId, setUserId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedMeetingId = localStorage.getItem("meetingId");
    const storedUserId = localStorage.getItem("userId");
    if (storedMeetingId) setMeetingId(storedMeetingId);
    if (storedUserId) setUserId(storedUserId);
  }, []);

  const handleStart = () => {
    if (!meetingId || !userId) return;
    localStorage.setItem("meetingId", meetingId);
    localStorage.setItem("userId", userId);
    router.push("/record");
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome to SideRec</h1>

      <div className="mb-4 space-y-2 max-w-md">
        <input
          className="border px-3 py-2 rounded w-full"
          value={meetingId}
          onChange={(e) => setMeetingId(e.target.value)}
          placeholder="Meeting ID"
        />
        <input
          className="border px-3 py-2 rounded w-full"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Your User ID"
        />
        <button
          onClick={handleStart}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Start Recording
        </button>
      </div>
    </main>
  );
}