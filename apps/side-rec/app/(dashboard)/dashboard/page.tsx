"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRecoilState } from "recoil";
import { meetingsState, userState } from "../../../store/userAtom";


const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joinId, setJoinId] = useState("");
  const [user, setUser] = useRecoilState(userState);
  const [ meetings, setMeetings ] = useRecoilState(meetingsState)
  const { data: session, status } = useSession();
  useEffect(() => {
    console.log("Session data:", session);
    if (session?.user) {
      console.log("Setting user data:", session.user);
      setUser({
        userId: session.user.id ?? "",
        fullname: session.user.name ?? "",
        email: session.user.email ?? "",
        profilePic: session.user.image ?? "",
      });
    }
  }, [session, setUser]);


  const filteredMeetings = (meetings || []).filter((meeting) =>
    meeting.title.toLowerCase().includes(search.toLowerCase())
  );
console.log("userId before useEffect: ", user.userId)
  const generateMeetingId = () => Math.random().toString(36).substring(2, 10);

  const handleCreateMeeting = async () => {
    if (!user.userId) {
      console.error("No user ID available");
      return;
    }
    try {
      const meetingId = generateMeetingId();
      const res = await fetch("http://localhost:4000/api/meeting/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId: user.userId, title: "Untitled Meeting", meetingId }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("data: ", data);
      if (data.meeting?.meetingId) {
        window.location.href = `/meeting/${data.meeting.meetingId}`;
      } else {
        console.error("No meeting ID in response:", data);
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
    }
  };
  useEffect(() => {
    console.log("fetching meeting history...");
    const fetchMeetings = async () => {
      if (!user.userId) {
        console.warn("No userId found. Skipping fetch.");
        return;
      }
      try {
        const res = await fetch(`http://localhost:4000/api/meeting/history/${user.userId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        console.log("Fetched meetings:", data);
        setMeetings(data.meetings || []); 
      } catch (error) {
        console.error("Error fetching meetings:", error);
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMeetings();
  }, [user?.userId, setMeetings]);
  const clearState = () => {
    setUser({
      userId: "",
      fullname: "",
      email: "",
      profilePic: "",
    });
    setMeetings([]);
  };
  if (status === "loading") {
    return <div className="p-6 max-w-4xl mx-auto">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="p-6 max-w-4xl mx-auto">Please log in to access the dashboard.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl text-white font-bold mb-4">
        Welcome, {user?.email || "User"} 👋
      </h1>
      <button
        onClick={() => {
          clearState();
          signOut({ callbackUrl: "/auth/login" });
        }}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4"
      >
        Logout
      </button>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-sm text-gray-600">Total Meetings</p>
          <p className="text-2xl font-bold">{meetings.length}</p>
        </div>
      </div>

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
                    {meeting.durationMs && (
                      <p className="text-xs text-gray-500">
                        Duration: {meeting.durationMs} min
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