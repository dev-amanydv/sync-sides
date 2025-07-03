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
  const { meetings, setMeetings, user, clearState } = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const filteredMeetings = meetings.filter((meeting) =>
    meeting.title.toLowerCase().includes(search.toLowerCase())
  );

  const meetingId = `meeting-${Date()}`;

  const handleCreateMeeting = async () => {
    if (!user?.userId) return;
    const res = await fetch("/api/meeting/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId: user.userId, title: "Untitled Meeting", meetingId: meetingId }),
    });

    const data = await res.json();
    if (data.meetingId) {
      window.location.href = `/meeting/${data.meetingId}`;
    }
  };
  const handleMeetingHistory = async () => {
    if (!user?.userId) return;
    const res = await fetch("/api/meeting/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId }),
    });
    const data = await res.json();
    setMeetings(data);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
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
                      (window.location.href = `/meeting/${meeting.id}`)
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