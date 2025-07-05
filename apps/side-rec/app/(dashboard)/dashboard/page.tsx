"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "../../../store/useStore";

interface Meeting {
  id: string;
  title: string;
  createdAt: string;
  duration?: number; // in minutes
  uploaded?: boolean;
}

const DashboardPage = () => {
  const { meetings,setUser, user,setMeetings, clearState } = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joinId, setJoinId] = useState("");

  useEffect(() => {
    const rawUserId = localStorage.getItem("userId");
    const rawUsername = localStorage.getItem("userName"); // fix the key
  
    if (rawUserId) {
      setUser({
        userId: rawUserId,
        username: rawUsername || "", // optional fallback
      });
    }
  }, []);

  const filteredMeetings = meetings.filter((meeting) =>
    meeting.title.toLowerCase().includes(search.toLowerCase())
  );
console.log("userId before useEffect: ", user?.userId)
  const generateMeetingId = () => Math.random().toString(36).substring(2, 10);

  const handleCreateMeeting = async () => {
    console.log("clicked")
    if (!user?.userId) return;
    const meetingId = generateMeetingId();
    console.log("meetingId: ", meetingId)
    const res = await fetch("http://localhost:4000/api/meeting/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId: user.userId, title: "Untitled Meeting", meetingId }),
    });
    console.log("res: ", res);
    const data = await res.json();
    console.log("data: ", data);
    console.log("meetingId from backend: ", )
    if (data.meeting.meetingId) {
      window.location.href = `/meeting/${data.meeting.meetingId}`;
    }
  };
  useEffect(() => {
    console.log("fetching meeting history...");
    console.log("userId during fetch:", user?.userId);
    const fetchMeetings = async () => {
      if (!user?.userId) {
        console.warn("No userId found. Skipping fetch.");
        return;
      }
      try {
        const res = await fetch(`http://localhost:4000/api/meeting/history/${user.userId}`);
        console.log("res: ", res)
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        console.log("Fetched meetings:", data);
        setMeetings(data.meetings); // ⚠️ `data` is an object with `meetings`
      } catch (error) {
        console.error("Error fetching meetings:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMeetings();
  }, [user?.userId]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl text-white font-bold mb-4">
        Welcome, {user?.username || "User"} 👋
      </h1>
      <button
        onClick={() => {
          localStorage.clear();
          clearState();
          window.location.href = "/auth/login";
        }}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4"
      >
        Logout
      </button>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-sm text-gray-600">Total Meetings</p>
          <p className="text-2xl font-bold">{meetings.length}</p>
        </div>
      </div>

      {/* Create Meeting */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleCreateMeeting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create New Meeting
        </button>
        <input
          type="text"
          placeholder="Search meetings..."
          className="px-3 py-2 border rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Enter Meeting ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          className="px-3 text-white py-2 border rounded w-full"
        />
        <button
          onClick={() => {
            if (joinId) window.location.href = `/meeting/${joinId}`;
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Join Meeting
        </button>
      </div>

      {/* Meeting List */}
      <div className="mt-4">
        {loading ? (
          <p>Loading meetings...</p>
        ) : filteredMeetings.length === 0 ? (
          <p>No meetings found.</p>
        ) : (
          <ul className="space-y-4">
            {filteredMeetings.map((meeting) => (
              <li key={meeting.id} className="border p-4 rounded">
                <div className="flex justify-between">
                  <div>
                    <h2 className="font-semibold">{meeting.title}</h2>
                    <p className="text-sm text-gray-600">
                      {new Date(meeting.createdAt).toLocaleString()}
                    </p>
                    {meeting.duration && (
                      <p className="text-xs text-gray-500">
                        Duration: {meeting.duration} min
                      </p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        meeting.uploaded ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {meeting.uploaded ? "Uploaded" : "Not Uploaded"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      (window.location.href = `/meeting/${meeting.meetingId}`)
                    }
                    className="text-blue-600 underline mt-1"
                  >
                    Go to Meeting
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;