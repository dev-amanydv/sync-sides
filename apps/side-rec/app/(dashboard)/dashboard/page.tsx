"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaPlay, FaPlus, FaUsers } from "react-icons/fa6";
import { Users } from 'lucide-react';
import { GrFormSchedule, GrSchedule } from "react-icons/gr";
import { PiVideoConference } from "react-icons/pi";
import { CiTimer } from "react-icons/ci";
import { GrStorage } from "react-icons/gr";
import { FiDownload } from "react-icons/fi";
import { IoShareSocialSharp } from "react-icons/io5";
import { IoMdTime } from "react-icons/io";

const DashboardPage = () => {
  type Meeting = {
    id: number,
    title: string,
    createdAt: string,
    meetingId: string,
    durationMs: number,
    uploaded?: boolean,
    status: "Uploaded" | "Processing" | "Available"
  }
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joinId, setJoinId] = useState("");
  const { data: session, status } = useSession();
  console.log("session: ", session);
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [user, setUser] = useState({
    userId: "",
    fullname: "",
    email : "",
    profilePic: ""
  })
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
  
  if (status === "loading") {
    return <div className="p-6 max-w-4xl mx-auto">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="p-6 max-w-4xl mx-auto">Please log in to access the dashboard.</div>;
  }

  return (
    <div className="px-6 mx-auto">
      <div className="flex flex-col my-6 gap-2">
        <h1 className="text-3xl text-white font-semibold">
          Welcome, {user?.fullname || "User"} 👋
        </h1>
        <p className="text-gray-400">
          Ready to record your next important conversation?
        </p>
      </div>
      
      <div className="flex gap-10 text-white my-6 justify-between w-full ">
        <div className="bg-[#0A0A0A] gap-5  flex rounded-md flex-col border-[1px] w-sm border-[#2C2C2C] p-5 ">
          <div className="flex items-center justify-between gap-3">
            <div className=" flex gap-2 flex-col">
              <h1 className="text-lg font-semibold ">Start New Meeting</h1>
              <p className="text-md text-[#A3A3A3] max-w-55">Create a meeting room and invite participants</p>
            </div>
            <div className="rounded-full size-14 flex justify-center items-center bg-[#14532D]"><FaPlus className="text-[#49DE80] text-3xl" /></div>
          </div>
          <button onClick={handleCreateMeeting} className="w-full bg-white text-black font-medium text-center py-2 rounded-md">Create Meeting</button>
        </div>
        <div className="bg-[#0A0A0A] gap-5  flex rounded-md flex-col border-[1px] w-sm border-[#2C2C2C] p-5 ">
          <div className="flex items-center justify-between gap-3">
            <div className=" flex gap-2 flex-col">
              <h1 className="text-lg font-semibold ">Join Meeting</h1>
              <p className="text-md text-[#A3A3A3] max-w-55">Join an existing meeting with room ID</p>
            </div>
            <div className="rounded-full size-14 flex justify-center items-center bg-[#14532D]"><Users className="text-[#49DE80] text-3xl" /></div>
          </div>
          <button className="w-full bg-white text-black text-center font-medium py-2 rounded-md">Join Meeting</button>
        </div>
        <div className="bg-[#0A0A0A] gap-5  flex rounded-md flex-col border-[1px] w-sm border-[#2C2C2C] p-5 ">
          <div className="flex items-center justify-between gap-3">
            <div className=" flex gap-2 flex-col">
              <h1 className="text-lg font-semibold ">Schedule</h1>
              <p className="text-md text-[#A3A3A3] max-w-55">View and manage upcoming meetings</p>
            </div>
            <div className="rounded-full size-14 flex justify-center items-center bg-[#14532D]"><GrSchedule className="text-[#49DE80] text-2xl" /></div>
          </div>
          <button className="w-full bg-white text-black text-center font-medium py-2 rounded-md">View Schedule</button>
        </div>
      </div>

      <div className="my-6">
        <h1 className="text-2xl font-semibold text-white ">Analytics</h1>
        <div className=" text-white mt-5 gap-10 px-10 flex justify-between">
          <div className="flex gap-2  flex-col">
            <div className="flex gap-10 justify-between"><h1 className="text-xl">Total Meetings</h1><PiVideoConference  className="text-2xl"/></div>
            <h1 className="text-2xl pl-3 font-bold">{meetings.length}</h1>
            <p className="text-gray-400">of all time</p>
          </div>
          <div className="flex gap-2 flex-col">
            <div className="flex gap-10 justify-between"><h1 className="text-xl">Total Duration</h1><CiTimer  className="text-2xl"/></div>
            <h1 className="text-2xl pl-3 font-bold">{meetings.length}</h1>
            <p className="text-gray-400">Across all hosted meetings</p>
          </div>          
          <div className="flex gap-2 flex-col">
            <div className="flex gap-10 justify-between"><h1 className="text-xl">Storage Used</h1><GrStorage  className="text-2xl"/></div>
            <h1 className="text-2xl pl-3 font-bold">{meetings.length}</h1>
            <p className="text-gray-400">Storage used of server</p>
          </div>        
        </div>
      </div>
      <div className="my-6">
        <div>
        <h1 className="text-2xl font-semibold text-white ">Recent Meetings</h1>
        </div>
        <div className=" text-white mt-5 gap-5 px-10 flex flex-col">
          <div className="w-full items-center flex px-5 py-2 rounded-md border-[1px] border-[#2C2C2C] bg-[#0A0A0A] justify-between h-25 ">
            <div className="flex items-center gap-5">
              <div className="size-15 border-[1px] rounded-md"></div>
              <div className="flex flex-col gap-1">
                <div className="text-lg items-center flex gap-5"><h1>Weekly Team Standup</h1>
                  <div className="text-[0.8rem] flex items-center h-fit px-4  bg-green-800 text-green-400 rounded-full">Uploading</div>
                </div>
                <div className="flex text-[#A3A3A3] gap-3">
                  <div className="gap-1 flex">
                  <GrFormSchedule className="text-lg" />
                    <h1 className="text-[0.8rem]">11/7/2025</h1>
                  </div>
                  <div className="gap-1 flex">
                  <IoMdTime className="text-lg" />
                    <h1 className="text-[0.8rem]">45:3 Minutes</h1>
                  </div>
                  <div className="gap-1 flex">
                  <FaUsers className="text-md" />
                    <h1 className="text-[0.8rem]">3 Participants</h1>
                  </div>
                </div>
                <div className="text-[0.8rem] text-[#A3A3A3]">
                  Participants: Aman Yadav, Laksh Sharma, Nishant Saini, Arbaaz Khan
                </div>
              </div>
            </div>
            <div className="flex gap-2 h-fit">
              <button className="flex rounded-md hover:bg-[#2C2C2C]  gap-2 items-center border-[1px] border-[#2C2C2C] px-4 py-1.5">
                <FaPlay />
                <h1>Play</h1>
              </button>
              <button className="flex rounded-md hover:bg-[#2C2C2C]  gap-2 items-center border-[1px] border-[#2C2C2C] px-4 py-1.5">
              <FiDownload className="text-xl"/>
                <h1>Download</h1>
              </button>              
              <button className="flex rounded-md hover:bg-[#2C2C2C]  gap-2 items-center border-[1px] border-[#2C2C2C] px-4 py-1.5">
              <IoShareSocialSharp  className="text-xl"/>
                <h1>Share</h1>
              </button>            
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 my-20 gap-4 mb-6">
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