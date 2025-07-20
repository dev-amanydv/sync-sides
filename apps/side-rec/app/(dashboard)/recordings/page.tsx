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
  const {  data:session } = useSession();
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState({
    userId: "",
    fullname: "",
    email : "",
    profilePic: ""
  })
  
  useEffect(() => {
    console.log("Session ", session);
    if (session?.user) {
      console.log("Setting user ", session.user);
      setUser({
        userId: session.user.id ?? "",
        fullname: session.user.name ?? "",
        email: session.user.email ?? "",
        profilePic: session.user.image ?? "",
      });
    }
  }, [session, setUser]);
  
  const userId = user.userId;

  useEffect(() => {
    const fetchMeetings = async () => {
        if (!userId) {
            console.log("userId required to fetch meetings: ", userId)
            return;
        }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meeting/history/${userId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch recordings');
        }

        setMeetings(data.meetings || []);
      } catch (error: unknown) {
        if ((error as Error).message === 'no internet connection') {
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
    <div className="text-white px-4 md:px-6 py-4 md:py-6 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">Your Past Recordings</h1>
        <p className="text-sm md:text-base text-gray-400">
          View and manage all your recorded meetings
        </p>
      </div>

      {/* Error Modal */}
      {errorMessage === "⚠️ No internet connection. Please check your network." && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/50 p-4">
          <div className="bg-[#0A0A0A] border border-[#232323] text-white rounded-xl shadow-lg p-4 md:p-6 w-full max-w-lg md:max-w-xl">
            <h2 className="text-lg md:text-xl mb-1 font-medium">Error</h2>
            <p className="text-sm text-[#A1A1A1] mb-4">Refresh again after fixing connection issue.</p>
            <div className="flex justify-center items-center my-8 md:my-10">
              <p className="text-lg md:text-2xl font-bold text-white mb-4 text-center">
                ⚠️ No internet connection. Please check your network.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-4 md:space-y-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-full flex flex-col md:flex-row md:justify-between md:items-start px-4 md:px-5 py-4 md:py-4 rounded-md border border-[#2C2C2C] bg-[#0A0A0A] gap-4"
            >
              <div className="flex flex-col gap-3 w-full">
                {/* Title and Status */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="h-5 md:h-6 w-48 md:w-64 bg-gray-700 rounded" />
                  <div className="h-5 md:h-6 w-20 md:w-24 bg-green-900 rounded" />
                </div>

                {/* Meeting Details */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                  <div className="h-4 w-full md:w-48 bg-gray-800 rounded" />
                  <div className="h-4 w-full md:w-32 bg-gray-800 rounded" />
                  <div className="h-4 w-full md:w-32 bg-gray-800 rounded" />
                </div>

                {/* Host Info */}
                <div className="h-4 w-32 md:w-40 bg-gray-700 rounded" />
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <div className="h-10 w-full md:w-20 bg-gray-700 rounded" />
                <div className="h-10 w-full md:w-28 bg-gray-700 rounded" />
                <div className="h-10 w-full md:w-24 bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 md:py-16">
          <div className="text-4xl md:text-6xl mb-4">📹</div>
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-300">No recordings found</h3>
          <p className="text-sm md:text-base text-gray-500">
            Your recorded meetings will appear here once you start hosting sessions.
          </p>
        </div>
      ) : (
        /* Meetings List */
        <div className="space-y-4 md:space-y-6">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="w-full flex flex-col md:flex-row gap-4 px-4 md:px-5 py-4 md:py-5 rounded-md border border-[#2C2C2C] bg-[#0A0A0A] hover:border-[#3C3C3C] transition-colors duration-200"
            >
              {/* Meeting Info Section */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                {/* Title and Status */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                  <h2 className="text-base md:text-lg font-medium text-white truncate">
                    {meeting.title}
                  </h2>
                  <span className="text-xs md:text-sm bg-green-800 text-green-400 px-2 md:px-3 py-1 rounded-full w-fit">
                    {meeting.status}
                  </span>
                </div>

                {/* Meeting Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm text-[#A3A3A3]">
                  <div className="flex items-center gap-2">
                    <GrFormSchedule className="text-sm md:text-base flex-shrink-0" />
                    <span className="truncate">
                      {new Date(meeting.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoMdTime className="text-sm md:text-base flex-shrink-0" />
                    <span>
                      {meeting.durationMs ? `${meeting.durationMs} Minutes` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-sm flex-shrink-0" />
                    <span>3 Participants</span>
                  </div>
                </div>

                {/* Host Information */}
                <div className="text-xs md:text-sm text-[#A3A3A3]">
                  <span className="font-medium">Host:</span> {meeting.hostName || 'Unknown'}
                </div>

                {/* Mobile-only additional info */}
                <div className="md:hidden text-xs text-[#A3A3A3] pt-2 border-t border-[#2C2C2C]">
                  <span>Recording ID: {meeting.id}...</span>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="flex flex-col md:flex-row gap-2 md:gap-2 w-full md:w-auto md:flex-shrink-0">
                <button className="flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2 md:py-2.5 border border-[#2C2C2C] rounded-md hover:bg-[#2C2C2C] transition-colors duration-200 text-sm md:text-base">
                  <FaPlay className="text-xs md:text-sm" />
                  <span>Play</span>
                </button>
                <button className="flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2 md:py-2.5 border border-[#2C2C2C] rounded-md hover:bg-[#2C2C2C] transition-colors duration-200 text-sm md:text-base">
                  <FiDownload className="text-xs md:text-sm" />
                  <span>Download</span>
                </button>
                <button className="flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2 md:py-2.5 border border-[#2C2C2C] rounded-md hover:bg-[#2C2C2C] transition-colors duration-200 text-sm md:text-base">
                  <IoShareSocialSharp className="text-xs md:text-sm" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer info for mobile */}
      {meetings.length > 0 && (
        <div className="mt-8 md:mt-12 p-4 bg-[#0A0A0A] border border-[#2C2C2C] rounded-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <p className="text-xs md:text-sm text-[#A3A3A3]">
              Showing {meetings.length} recording{meetings.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs md:text-sm text-[#A3A3A3]">
              Total storage: Calculating...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingsPage;
