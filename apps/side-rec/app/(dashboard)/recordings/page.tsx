'use client';

import React, { useEffect, useState } from 'react';
import { GrFormSchedule } from 'react-icons/gr';
import { IoMdTime } from 'react-icons/io';
import { FaUsers, FaPlay } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import { IoShareSocialSharp } from 'react-icons/io5';
import { useSession } from 'next-auth/react';

type Meeting = {
  id: string;
  title: string;
  createdAt: string;
  durationMs: number;
  status: string;
  hostName?: string;
};

const RecordingsPage = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const [errorMessage, setErrorMessage] = useState('');
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
  const userId = user.userId; // replace with actual userId from session or state

  useEffect(() => {
    const fetchMeetings = async () => {
        if (!userId) {
            console.log("userId required to fetch meetings: ", userId)
            return;
        }
      try {
        const res = await fetch(`http://localhost:4000/api/meeting/history/${userId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch recordings');
        }

        setMeetings(data.meetings || []);
      } catch (error: any) {
        if (error.message === 'no internet connection') {
          setErrorMessage('⚠️ No internet connection. Please check your network.');
        } else {
          setErrorMessage('Something went wrong while fetching recordings.');
        }
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [userId]);

  return (
    <div className="text-white px-6 py-4">
      <h1 className="text-2xl font-bold mb-4">Your Past Recordings</h1>

      {errorMessage === "⚠️ No internet connection. Please check your network." ? ( <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-opacity-100">
          <div className="bg-[#0A0A0A] border-[1px] border-[#232323] text-white rounded-xl  shadow-lg p-6 w-full max-w-xl">
            <h2 className="text-xl mb-1 font-medium">Error</h2>
            <p className="text-sm max-w-sm text-[#A1A1A1] mb-4">Refresh again after fixing connection issue.</p>
            <div className="flex justify-center items-center my-10 "> <p className="text-2xl max-w-sm font-bold text-white mb-4">⚠️ No internet connection. Please check your network.</p>
            </div>
            <div className="flex justify-end">
            </div>
            
          </div>
        </div>) : ("")}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="w-full flex justify-between items-start px-5 py-4 rounded-md border border-[#2C2C2C] bg-[#0A0A0A]"
            >
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-48 bg-gray-700 rounded" />
                  <div className="h-5 w-24 bg-green-900 rounded" />
                </div>

                <div className="flex gap-6 mt-2">
                  <div className="h-4 w-64 bg-gray-800 rounded" />
                  <div className="h-4 w-40 bg-gray-800 rounded" />
                  <div className="h-4 w-40 bg-gray-800 rounded" />
                </div>

                <div className="h-4 w-40 bg-gray-700 rounded" />
              </div>

              <div className="flex gap-2 mt-2 sm:mt-0">
                <div className="h-10 w-20 bg-gray-700 rounded" />
                <div className="h-10 w-28 bg-gray-700 rounded" />
                <div className="h-10 w-24 bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div>No recordings found.</div>
      ) : (
        <ul className="flex flex-col gap-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="w-full flex justify-between items-start px-5 py-4 rounded-md border border-[#2C2C2C] bg-[#0A0A0A]"
            >
              <div className="flex flex-col gap-1">
                <div className="text-lg font-medium flex gap-3 items-center">
                  <h1>{meeting.title}</h1>
                  <span className="text-sm bg-green-800 text-green-400 px-2 py-0.5 rounded-full">
                    {meeting.status}
                  </span>
                </div>

                <div className="flex text-sm text-[#A3A3A3] gap-5 mt-1">
                  <div className="flex items-center gap-1">
                    <GrFormSchedule />
                    <span>{new Date(meeting.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IoMdTime />
                    <span>{meeting.durationMs ? `${meeting.durationMs} Minutes` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaUsers />
                    <span>3 Participants</span>
                  </div>
                </div>

                <div className="text-sm text-[#A3A3A3]">
                  Host: {meeting.hostName || 'Unknown'}
                </div>
              </div>

              <div className="flex gap-2 mt-2 sm:mt-0">
                <button className="flex items-center gap-2 px-4 py-2 border border-[#2C2C2C] rounded hover:bg-[#2C2C2C]">
                  <FaPlay />
                  Play
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#2C2C2C] rounded hover:bg-[#2C2C2C]">
                  <FiDownload />
                  Download
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#2C2C2C] rounded hover:bg-[#2C2C2C]">
                  <IoShareSocialSharp />
                  Share
                </button>
              </div>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecordingsPage;