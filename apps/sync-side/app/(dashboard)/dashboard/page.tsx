"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaPlay, FaPlus, FaUsers } from "react-icons/fa6";
import { Users, ChevronLeft } from "lucide-react";
import { GrFormSchedule, GrSchedule } from "react-icons/gr";
import { PiVideoConference } from "react-icons/pi";
import { CiTimer } from "react-icons/ci";
import { GrStorage } from "react-icons/gr";
import { FiDownload } from "react-icons/fi";
import { IoShareSocialSharp } from "react-icons/io5";
import { IoIosSearch, IoMdTime } from "react-icons/io";
import Link from "next/link";
import Image from "next/image";
import { recordingBadge } from "@/lib/meeting/recordingStatus";
import type { RecordingStatus } from "@/lib/meeting/types";

const parseMeetingId = (raw: string): string => {
  const t = raw.trim();
  if (!t) return "";
  // A pasted meeting link — pull the id out of /meeting/<id>.
  const m = t.match(/\/meeting\/([^/?#\s]+)/);
  if (m) return m[1] as string;
  // Any other URL — fall back to its last path segment.
  try {
    const seg = new URL(t).pathname.split("/").filter(Boolean).pop();
    if (seg) return seg;
  } catch {
    /* not a URL — treat the raw input as the id */
  }
  return t;
};

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
};

const DashboardPage = () => {
  type Meeting = {
    id: number;
    title: string;
    createdAt: string;
    meetingId: string;
    durationMs: number;
    recorded?: boolean;
    recording?: { status: RecordingStatus } | null;
    mergedPath: string;
    participants: {
      user: {
        fullname: string;
      };
    }[];
  };

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [joinId, setJoinId] = useState("");
  const [meetingDetails, setMeetingDetails] = useState({
    title: "",
    description: "",
  });
  const { data: session, status } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [storageBytes, setStorageBytes] = useState(0);
  const [user, setUser] = useState({
    userId: "",
    fullname: "",
    email: "",
    profilePic: "",
  });
  const [open, setOpen] = useState(false);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [copiedMeetingId, setCopiedMeetingId] = useState<number | null>(null);
  const [showHowToPopup, setShowHowToPopup] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    {
      text: "Create a meeting and share the invite link. Each side records locally in high quality — no bandwidth loss.",
      img: "/record1.svg",
    },
    {
      text: "As the host, toggle Record (or enable Record automatically in the lobby) to start capturing both sides at once.",
      img: "/record2.svg",
    },
    {
      text: "When you end the meeting, every recorded chunk uploads in the background — nothing to click.",
      img: "/record3.svg",
    },
    {
      text: "We stitch both sides into a single side-by-side video and it appears here, ready to play, download, or share.",
      img: "/record4.svg",
    },
  ];
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem("hasSeenHowToPopup");
    if (!hasSeenPopup) {
      setShowHowToPopup(true);
    }
  }, []);
  const handleCloseHowToPopup = () => {
    sessionStorage.setItem("hasSeenHowToPopup", "true");
    setShowHowToPopup(false);
  };

  useEffect(() => {
    if (session?.user) {
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
  const generateMeetingId = () => Math.random().toString(36).substring(2, 10);
  const handleCreateMeeting = async () => {
    if (!user.userId) {
      console.error("No user ID available");
      return;
    }
    if (!meetingDetails.title.trim()) {
      alert("Please enter a meeting title.");
      return;
    }
    try {
      setLoadingCreate(true);
      const meetingId = generateMeetingId();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meeting/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostId: user.userId,
            title: meetingDetails.title,
            description: meetingDetails.description,
            meetingId,
          }),
        }
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.meeting?.meetingId) {
        window.location.href = `/meeting/${data.meeting.meetingId}`;
      } else {
        console.error("No meeting ID in response:", data);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error creating meeting:", error.message);
      } else {
        console.error("Error creating meeting:", error);
      }
    } finally {
      setLoadingCreate(false);
    }
  };
  const fetchMeetings = useCallback(async () => {
    if (!user.userId) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meeting/history/${user.userId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch meetings");
      setMeetings(data.meetings || []);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "No internet connection") {
        setErrorMessage("⚠️ No internet connection. Please check your network.");
      } else {
        setErrorMessage("Something went wrong while fetching meetings.");
      }
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  const fetchStorage = useCallback(async () => {
    if (!user.userId) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meeting/storage/${user.userId}`
      );
      const data = await res.json();
      if (res.ok) setStorageBytes(data.bytes ?? 0);
    } catch {
      /* non-critical — leave the last known value */
    }
  }, [user.userId]);

  useEffect(() => {
    fetchMeetings();
    fetchStorage();
  }, [fetchMeetings, fetchStorage]);

  // While any recording is still moving through the pipeline
  // (recording/uploading/merging), poll so the badges — and storage total —
  // update without a manual refresh.
  const hasTransient = meetings.some((m) => recordingBadge(m).transient);
  useEffect(() => {
    if (!hasTransient) return;
    const id = setInterval(() => {
      fetchMeetings();
      fetchStorage();
    }, 5000);
    return () => clearInterval(id);
  }, [hasTransient, fetchMeetings, fetchStorage]);

  // The backend file endpoint 302-redirects to a presigned R2 URL; adding
  // ?download=1 makes it force a download via Content-Disposition, so we don't
  // need a CORS-enabled bucket or an in-browser blob fetch.
  const handleDownload = useCallback((meeting: Meeting) => {
    if (!meeting.mergedPath) {
      alert("No recording available for download.");
      return;
    }
    const sep = meeting.mergedPath.includes("?") ? "&" : "?";
    window.location.href = `${meeting.mergedPath}${sep}download=1`;
  }, []);

  const handleShare = useCallback(async (meeting: Meeting) => {
    if (!meeting.mergedPath) {
      alert("No recording URL available to share.");
      return;
    }
    try {
      await navigator.clipboard.writeText(meeting.mergedPath);
      setCopiedMeetingId(meeting.id);
      setTimeout(() => {
        setCopiedMeetingId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      alert("Could not copy the URL to the clipboard.");
    }
  }, []);

  const totalDurationMs = meetings.reduce(
    (acc, meeting) => acc + (meeting.durationMs || 0),
    0
  );
  const totalMinutes = Math.round(totalDurationMs / (1000 * 60));
  let formattedDuration = `${totalMinutes} mins`;
  if (totalMinutes > 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    formattedDuration = `${hours} hr ${minutes} mins`;
  }
  if (status === "loading") {
    return (
      <div className="p-4 md:p-6 space-y-6 md:space-y-8 animate-pulse text-white bg-black min-h-screen">
        <div className="px-2">
          <div className="h-6 md:h-8 w-48 md:w-64 bg-gray-700 rounded mb-2" />
          <div className="h-4 w-60 md:w-80 bg-gray-800 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 md:p-6 space-y-4 border border-gray-700 rounded-md bg-white/[0.02]"
            >
              <div className="h-5 w-32 bg-gray-700 rounded" />
              <div className="h-4 w-full bg-gray-800 rounded" />
              <div className="h-10 w-full bg-gray-600 rounded" />
            </div>
          ))}
        </div>
        <div className="px-2">
          <div className="h-6 w-32 bg-gray-700 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-5 w-40 bg-gray-700 mb-2 rounded" />
                <div className="h-6 w-12 bg-gray-600 mb-1 rounded" />
                <div className="h-4 w-32 bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 px-2">
          <div className="flex flex-col md:flex-row gap-4 md:gap-0 md:justify-between">
            <div className="h-6 w-48 bg-gray-700 rounded" />
            <div className="h-8 w-full md:w-72 bg-gray-900 rounded" />
            <div className="h-8 w-24 bg-gray-800 rounded" />
          </div>
          <div className="flex flex-col gap-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row gap-4 md:gap-0 md:justify-between md:items-center p-4 bg-white/[0.02] border border-white/[0.06] rounded-md"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-md flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-full md:w-40 bg-gray-700 rounded" />
                    <div className="h-3 w-full md:w-64 bg-gray-800 rounded" />
                    <div className="h-3 w-full md:w-80 bg-gray-800 rounded" />
                  </div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <div className="h-8 w-16 bg-gray-700 rounded" />
                  <div className="h-8 w-20 bg-gray-700 rounded" />
                  <div className="h-8 w-16 bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (status === "unauthenticated") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        Please log in to access the dashboard.
      </div>
    );
  }
  return (
    <>
      {showHowToPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/50 p-4">
          <div className="bg-white/[0.02] border border-white/[0.08] text-white rounded-xl shadow-lg p-4 md:p-6 w-full max-w-lg md:max-w-xl flex flex-col">
            <h2 className="text-lg md:text-xl mb-4 font-medium text-center">
              How to Record a Meeting
            </h2>
            <div className="relative overflow-hidden flex-grow">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentStep * 100}%)` }}
              >
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="w-full flex-shrink-0 px-2 flex flex-col items-center text-center"
                  >
                    <p className="text-sm text-gray-300 mb-4 h-12">
                      {step.text}
                    </p>
                    <div className="relative w-full h-48 md:h-64 mb-4">
                      <Image
                        src={step.img}
                        layout="fill"
                        objectFit="contain"
                        alt={`Step ${index + 1}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="p-2 rounded-full bg-white/[0.04] hover:bg-[#2C2C2C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      currentStep === i ? "bg-white" : "bg-gray-600"
                    }`}
                  ></div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (currentStep < steps.length - 1) {
                    setCurrentStep((prev) => prev + 1);
                  } else {
                    handleCloseHowToPopup();
                  }
                }}
                className="px-4 py-2 bg-[#5E6AD2] rounded-lg text-white hover:bg-[#6E79D6] text-sm font-medium"
              >
                {currentStep < steps.length - 1 ? "Next" : "Got It!"}
              </button>
            </div>
          </div>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/50 p-4">
          <div className="bg-white/[0.02] border border-white/[0.08] text-white rounded-xl shadow-lg p-4 md:p-6 w-full max-w-lg md:max-w-xl">
            <h2 className="text-lg md:text-xl mb-1 font-medium">
              Create New Meeting
            </h2>
            <p className="text-sm text-[#A1A1A1] mb-4">
              Write title and description for your meeting. Click create when
              you&apos;re done.
            </p>
            <label className="block mb-2 text-sm">Title</label>
            <input
              type="text"
              value={meetingDetails.title}
              onChange={(e) =>
                setMeetingDetails({ ...meetingDetails, title: e.target.value })
              }
              className="w-full bg-white/[0.04] focus:outline-offset-2 focus:outline-[#3F3F3F] focus:outline-[1px] text-white placeholder:text-white placeholder:text-sm border mb-4 px-3 py-2 md:py-3 border-white/[0.08] rounded-lg"
              placeholder="Enter title"
            />
            <label className="block mb-2 text-sm">Description</label>
            <textarea
              value={meetingDetails.description}
              onChange={(e) =>
                setMeetingDetails({
                  ...meetingDetails,
                  description: e.target.value,
                })
              }
              className="w-full bg-white/[0.04] focus:outline-offset-2 focus:outline-[#3F3F3F] focus:outline-[1px] text-white placeholder:text-white placeholder:text-sm border mb-4 px-3 py-2 md:py-3 border-white/[0.08] rounded-lg min-h-[80px]"
              placeholder="Enter description"
            />
            <div className="flex flex-col md:flex-row justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 md:py-3 bg-white/[0.04] transition-all duration-100 hover:bg-[#383838] border border-white/[0.08] rounded-lg text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleCreateMeeting();
                  setOpen(false);
                }}
                disabled={loadingCreate}
                className="px-4 py-2 md:py-3 bg-[#5E6AD2] rounded-lg text-white hover:bg-[#6E79D6] text-sm md:text-base font-medium"
              >
                {loadingCreate ? "Creating..." : "Create Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Meeting Modal */}
      {open1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/50 p-4">
          <div className="bg-white/[0.02] border border-white/[0.08] text-white rounded-xl shadow-lg p-4 md:p-6 w-full max-w-lg md:max-w-xl">
            <h2 className="text-lg md:text-xl mb-1 font-medium">
              Join Meeting
            </h2>
            <p className="text-sm text-[#A1A1A1] mb-4">
              Paste a meeting link or enter the Meeting ID of the meeting you
              want to join. Click join when you&apos;re done.
            </p>
            <label className="block mb-2 text-sm">Meeting ID or link</label>
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const id = parseMeetingId(joinId);
                  if (id) window.location.href = `/meeting/${id}`;
                }
              }}
              className="w-full bg-white/[0.04] focus:outline-offset-2 focus:outline-[#3F3F3F] focus:outline-[1px] text-white placeholder:text-white placeholder:text-sm border mb-4 px-3 py-2 md:py-3 border-white/[0.08] rounded-lg"
              placeholder="Paste link or enter meeting id"
            />
            <div className="flex flex-col md:flex-row justify-end gap-2">
              <button
                onClick={() => setOpen1(false)}
                className="px-4 py-2 md:py-3 bg-white/[0.04] transition-all duration-100 hover:bg-[#383838] border border-white/[0.08] rounded-lg text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = parseMeetingId(joinId);
                  if (id) window.location.href = `/meeting/${id}`;
                }}
                disabled={loadingCreate}
                className="px-4 py-2 md:py-3 bg-[#5E6AD2] rounded-lg text-white hover:bg-[#6E79D6] text-sm md:text-base font-medium"
              >
                {loadingCreate ? "Checking..." : "Join Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {open2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/50 p-4">
          <div className="bg-white/[0.02] border border-white/[0.08] text-white rounded-xl shadow-lg p-4 md:p-6 w-full max-w-lg md:max-w-xl">
            <h2 className="text-lg md:text-xl mb-1 font-medium">Schedule</h2>
            <p className="text-sm text-[#A1A1A1] mb-4">
              You can schedule meetings for the future here.
            </p>
            <div className="flex justify-center items-center my-8 md:my-10">
              <p className="text-lg md:text-2xl font-bold text-white mb-4 text-center">
                This feature is in development
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setOpen2(false)}
                className="px-4 py-2 md:py-3 bg-white/[0.04] transition-all duration-100 hover:bg-[#383838] border border-white/[0.08] rounded-lg text-sm md:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage ===
        "⚠️ No internet connection. Please check your network." && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/50 p-4">
          <div className="bg-white/[0.02] border border-white/[0.08] text-white rounded-xl shadow-lg p-4 md:p-6 w-full max-w-lg md:max-w-xl">
            <h2 className="text-lg md:text-xl mb-1 font-medium">Error</h2>
            <p className="text-sm text-[#A1A1A1] mb-4">
              Refresh again after fixing connection issue.
            </p>
            <div className="flex justify-center items-center my-8 md:my-10">
              <p className="text-lg md:text-2xl font-bold text-white mb-4 text-center">
                ⚠️ No internet connection. Please check your network.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 mx-auto max-w-7xl">
        <div className="flex flex-col mb-6 md:mb-8 mt-4 md:mt-5 gap-2 px-2">
          <h1 className="text-xl md:text-2xl text-gray-200 font-semibold">
            Welcome, {user?.fullname || "User"} 👋
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Ready to record your next important conversation?
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-10 text-gray-200 mb-8 md:mb-12 px-2">
          <div className="bg-white/[0.02] gap-4 md:gap-5 flex rounded-md flex-col border border-white/[0.06] px-4 md:px-6 py-4 md:py-6 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 flex-col flex-1">
                <h1 className="text-base md:text-lg font-semibold">
                  Start New Meeting
                </h1>
                <p className="text-xs md:text-sm text-[#A3A3A3] max-w-none md:max-w-[200px]">
                  Create a meeting room and invite participants
                </p>
              </div>
              <div className="rounded-full size-12 md:size-14 flex justify-center items-center flex-shrink-0">
                <FaPlus className="text-gray-500 text-xl md:text-3xl" />
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="w-full hover:bg-[#6E79D6] hover:shadow-xl hover:shadow-gray-800 transition-all duration-300 ease-in-out cursor-pointer h-fit bg-[#5E6AD2] text-white font-medium text-center py-2 md:py-3 rounded-md text-sm md:text-base"
            >
              Create Meeting
            </button>
          </div>
          <div className="bg-white/[0.02] gap-4 md:gap-5 flex rounded-md flex-col border border-white/[0.06] px-4 md:px-6 py-4 md:py-6 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 flex-col flex-1">
                <h1 className="text-base md:text-lg font-semibold">
                  Join Meeting
                </h1>
                <p className="text-xs md:text-sm text-[#A3A3A3] max-w-none md:max-w-[200px]">
                  Join an existing meeting with a room ID or link
                </p>
              </div>
              <div className="rounded-full size-12 md:size-14 flex justify-center items-center flex-shrink-0">
                <Users className="text-gray-500 text-xl md:text-3xl" />
              </div>
            </div>
            <button
              onClick={() => setOpen1(true)}
              className="w-full hover:bg-[#6E79D6] hover:shadow-xl hover:shadow-gray-800 transition-all duration-300 ease-in-out bg-[#5E6AD2] text-white cursor-pointer text-center font-medium py-2 md:py-3 rounded-md text-sm md:text-base"
            >
              Join Meeting
            </button>
          </div>
          <div className="bg-white/[0.02] gap-4 md:gap-5 flex rounded-md flex-col border border-white/[0.06] px-4 md:px-6 py-4 md:py-6 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 flex-col flex-1">
                <h1 className="text-base md:text-lg font-semibold">Schedule</h1>
                <p className="text-xs md:text-sm text-[#A3A3A3] max-w-none md:max-w-[200px]">
                  View and manage upcoming meetings
                </p>
              </div>
              <div className="rounded-full size-12 md:size-14 flex justify-center items-center flex-shrink-0">
                <GrSchedule className="text-gray-500 text-lg md:text-2xl" />
              </div>
            </div>
            <button
              onClick={() => setOpen2(true)}
              className="w-full hover:bg-[#6E79D6] hover:shadow-xl hover:shadow-gray-800 transition-all duration-300 ease-in-out bg-[#5E6AD2] text-white cursor-pointer text-center font-medium py-2 md:py-3 rounded-md text-sm md:text-base"
            >
              View Schedule
            </button>
          </div>
        </div>
        <div className="my-6 md:my-8 px-2">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-200 mb-4 md:mb-6">
            Analytics
          </h1>
          <div className="text-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-12">
            <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] p-4 md:p-6 rounded-lg">
              <div className="flex mb-3 gap-3 justify-between items-center">
                <h1 className="text-base md:text-lg">Total Meetings</h1>
                <PiVideoConference className="text-xl md:text-2xl text-gray-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {meetings.length}
              </h1>
              <p className="text-gray-400 text-sm">of all time</p>
            </div>

            <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] p-4 md:p-6 rounded-lg">
              <div className="flex mb-3 gap-3 justify-between items-center">
                <h1 className="text-base md:text-lg">Total Duration</h1>
                <CiTimer className="text-xl md:text-2xl text-gray-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {formattedDuration}
              </h1>
              <p className="text-gray-400 text-sm">
                Across all hosted meetings
              </p>
            </div>

            <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] p-4 md:p-6 rounded-lg">
              <div className="flex mb-3 gap-3 justify-between items-center">
                <h1 className="text-base md:text-lg">Recordings</h1>
                <GrStorage className="text-xl md:text-2xl text-gray-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {meetings.filter((m) => recordingBadge(m).available).length}
              </h1>
              <p className="text-gray-400 text-sm">Ready to play or download</p>
            </div>

            <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] p-4 md:p-6 rounded-lg">
              <div className="flex mb-3 gap-3 justify-between items-center">
                <h1 className="text-base md:text-lg">Storage Used</h1>
                <GrStorage className="text-xl md:text-2xl text-gray-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {formatBytes(storageBytes)}
              </h1>
              <p className="text-gray-400 text-sm">Across your recordings on R2</p>
            </div>
          </div>
        </div>

        {/* Recent Meetings Section */}
        <div className="my-8 md:my-12 px-2">
          <div className="flex flex-col md:flex-row gap-4 md:gap-0 md:justify-between md:items-center mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-200">
              Recent Meetings
            </h1>

            {/* Search Input */}
            <div className="relative order-3 md:order-2">
              <input
                type="text"
                placeholder="Search by title"
                className="px-3 md:px-4 text-gray-400 py-2 md:py-2.5 rounded-full hover:outline-[1px] hover:outline-offset-2 hover:outline-gray-500 placeholder:text-[#2C2C2C] focus:outline-2 focus:outline-offset-2 focus:outline-gray-500 placeholder:text-sm md:placeholder:text-base border border-white/[0.06] w-full md:w-auto min-w-[250px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <IoIosSearch className="absolute right-3 text-lg md:text-xl text-gray-500 top-2.5 md:top-3" />
            </div>

            <Link href={"/recordings"} className="order-2 md:order-3">
              <button className="text-gray-200 flex cursor-pointer rounded-md hover:bg-[#2C2C2C] gap-2 items-center border border-white/[0.06] px-4 py-2 md:py-2.5 text-sm md:text-base w-full md:w-auto justify-center">
                View all
              </button>
            </Link>
          </div>

          {/* Meetings List */}
          <div className="text-gray-200 flex flex-col gap-4">
            {loading ? (
              <div className="text-lg md:text-xl font-semibold text-center py-8">
                Loading meetings...
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMeetings.map((meeting) => {
                  const badge = recordingBadge(meeting);
                  return (
                  <div
                    key={meeting.id}
                    className="w-full flex flex-col md:flex-row md:items-center px-4 md:px-5 py-4 md:py-4 rounded-md border border-white/[0.06] bg-white/[0.02] gap-4"
                  >
                    {/* Meeting Info */}
                    <div className="flex items-start md:items-center gap-3 md:gap-5 flex-1">
                      <div className="size-12 md:size-16 border border-white/[0.06] rounded-md flex-shrink-0"></div>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-5">
                          <h1 className="text-base md:text-lg font-medium truncate">
                            {meeting.title}
                          </h1>
                          <div
                            className={`text-xs px-3 py-1 rounded-full w-fit flex items-center gap-1.5 ${badge.className}`}
                          >
                            {badge.pulse && (
                              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                            )}
                            {badge.label}
                          </div>
                        </div>

                        {/* Meeting Details */}
                        <div className="flex flex-col md:flex-row text-[#A3A3A3] gap-2 md:gap-3 text-xs md:text-sm">
                          <div className="flex items-center gap-1">
                            <GrFormSchedule className="text-sm md:text-base flex-shrink-0" />
                            <span className="truncate">
                              {new Date(meeting.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IoMdTime className="text-sm md:text-base flex-shrink-0" />
                            <span>
                              {meeting.durationMs
                                ? `${Number(meeting.durationMs) / 1000} Seconds`
                                : "Not available"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaUsers className="text-sm flex-shrink-0" />
                            <span>
                              {meeting.participants &&
                              meeting.participants.length > 0
                                ? meeting.participants.length <= 2
                                  ? // If 2 or fewer, show their names
                                    meeting.participants
                                      .map((p) => p.user.fullname)
                                      .join(", ")
                                  : // If more than 2, show the count
                                    `${meeting.participants.length} Participants`
                                : // If no participants, show 0
                                  "0 Participants"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {badge.available ? (
                      <div className="flex gap-2 md:gap-2 flex-wrap md:flex-nowrap">
                        <button
                          onClick={() =>
                            window.open(meeting.mergedPath, "_blank", "noopener")
                          }
                          className="flex cursor-pointer rounded-md hover:bg-[#2C2C2C] gap-2 items-center border border-white/[0.06] px-3 md:px-4 py-2 flex-1 md:flex-none justify-center text-sm"
                        >
                          <FaPlay className="text-xs" />
                          <span>Play</span>
                        </button>
                        <button
                          onClick={() => handleDownload(meeting)}
                          className="flex cursor-pointer rounded-md hover:bg-[#2C2C2C] gap-2 items-center border border-white/[0.06] px-3 md:px-4 py-2 flex-1 md:flex-none justify-center text-sm"
                        >
                          <FiDownload className="text-sm" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => handleShare(meeting)}
                          className={`flex rounded-md cursor-pointer hover:bg-[#2C2C2C] gap-2 items-center border border-white/[0.06] px-3 md:px-4 py-2 flex-1 md:flex-none justify-center text-sm transition-colors ${
                            copiedMeetingId === meeting.id
                              ? "bg-green-700 hover:bg-green-700 text-white"
                              : ""
                          }`}
                        >
                          {copiedMeetingId === meeting.id ? (
                            <>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <IoShareSocialSharp className="text-sm" />
                              <span>Share</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : null}
                    {badge.available ? null : (
                      <div className="flex gap-2 md:gap-2 flex-wrap md:flex-nowrap">
                        <button disabled className="flex bg-gray-500 text-gray-100 opacity-20 cursor-pointer rounded-md  gap-2 items-center   px-3 md:px-4 py-2 flex-1 md:flex-none justify-center text-sm">
                          <FaPlay className="text-xs" />
                          <span>Play</span>
                        </button>
                        <button disabled className="flex bg-gray-500 text-gray-100 opacity-20 cursor-pointer rounded-md  gap-2 items-center  px-3 md:px-4 py-2 flex-1 md:flex-none justify-center text-sm">
                          <FiDownload className="text-sm" />
                          <span className="hidden md:inline">Download</span>
                          <span className="md:hidden">Download</span>
                        </button>
                        <button disabled className="flex bg-gray-500 text-gray-100 opacity-20 rounded-md cursor-pointer  gap-2 items-center   px-3 md:px-4 py-2 flex-1 md:flex-none justify-center text-sm">
                          <IoShareSocialSharp className="text-sm" />
                          <span>Share</span>
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};
export default DashboardPage;