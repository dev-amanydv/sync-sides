
"use client";

import { useEffect, useState } from "react";

export default function MergePage() {
    const [meetingId, setMeetingId] = useState("");
    const [userId, setUserId] = useState("");
    const [partnerId, setPartnerId] = useState("friend");
    const [log, setLog] = useState("");
  

    useEffect(() => {
    const storedMeetingId = localStorage.getItem("meetingId");
    const storedUserId = localStorage.getItem("userId");
    if (storedMeetingId) setMeetingId(storedMeetingId);
    if (storedUserId) setUserId(storedUserId);
    }, []);

  const mergeUserChunks = async () => {
    setLog("Merging user's chunks...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, userId }),
      });

      const data = await res.json();
      if (res.ok) {
        setLog(`✅ User merge successful: ${data.output}`);
      } else {
        setLog(`❌ User merge failed: ${data.error}`);
      }
    } catch (error) {
      setLog("❌ Error merging user chunks.");
      console.log("❌ Error merging user chunks: ", error)
    }
  };

  const mergeSideBySide = async () => {
    setLog("Merging side-by-side...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/merge/side-by-side`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, userA: userId, userB: partnerId }),
      });

      const data = await res.json();
      if (res.ok) {
        setLog(`✅ Side-by-side merge successful: ${data.output}`);
      } else {
        setLog(`❌ Side-by-side merge failed: ${data.error}`);
      }
    } catch (error) {
      setLog("❌ Error during side-by-side merge.");
      console.log("❌ Error during side-by-side merge: ", error)
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Merge Tools</h1>

      <div className="mb-4 space-y-2">
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
        <input
          className="border px-3 py-2 rounded w-full"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
          placeholder="Partner User ID"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={mergeUserChunks}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Merge My Chunks
        </button>
        <button
          onClick={mergeSideBySide}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Merge Side-by-Side
        </button>
      </div>

      <p className="text-gray-700 whitespace-pre-wrap">{log}</p>
    </main>
  );
}