"use client";

import io from "socket.io-client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../../../../store/useStore";

const MeetingPage = () => {
  const params = useParams();
  const meetingId = params?.id as string;
  const [isRecording, setIsRecording] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [chunkStatuses, setChunkStatuses] = useState<string[]>([]);
  const [joinedUsers, setJoinedUsers] = useState<
    { id: number; username: string; socketId?: string }[]
  >([]);
  const [otherSocketId, setOtherSocketId] = useState<string | null>(null);
  const otherSocketIdRef = useRef<string | null>(null); // Add this line
  const [selectedPartner, setSelectedPartner] = useState<string | undefined>(
    undefined
  );
  const [hasJoined, setHasJoined] = useState(false);
  const [initialParticipants, setInitialParticipants] = useState<
    { id: number; username: string }[]
  >([]);
  const [meetingNoId, setMeetingNoId] = useState("");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(0)

  console.log("meetingNoId: ", meetingNoId);
  useEffect(() => {
    const fetchInitialParticipants = async () => {
      if (!meetingId) return;
      try {
        const res = await fetch(
          `http://localhost:4000/api/meeting/details/${meetingId}`
        );
        const data = await res.json();
        console.log("data of getMeeting: ", data);
        if (res.ok && Array.isArray(data.meeting.participants)) {
          setMeetingNoId(data.meeting.id);
          if (user?.userId && data.meeting.hostId === Number(user.userId)) {
            setIsHost(true);
          }
          const joined = data.meeting.participants.filter(
            (p: any) => p.hasJoined
          );
          setInitialParticipants(joined);
        }
      } catch (err) {
        console.error("Failed to fetch participants", err);
      }
    };

    fetchInitialParticipants();
  }, [meetingId]);
  const handleEndMeeting = async () => {
    try {
      await fetch("http://localhost:4000/api/meeting/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          hostId: Number(user?.userId),
        }),
      });
      alert("Meeting ended.");
    } catch (err) {
      console.error("Failed to end meeting", err);
    }
  };

  const handleLeaveMeeting = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    socket.current?.disconnect();
    socket.current = null;

    alert("You left the meeting.");
  };
  const { user, setUser } = useStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const socket = useRef<any>(null);

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    const rawUserId = localStorage.getItem("userId");
    const rawUsername = localStorage.getItem("userName");

    if (rawUserId) {
      setUser({ userId: rawUserId, username: rawUsername || "" });
    }

    setHasHydrated(true);
  }, []);

  const [mergeLog, setMergeLog] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chunkIndexRef = useRef(0);
  const uploadInterval = 5000;

  const createPeerConnection = (socket: any, targetSocketId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: targetSocketId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          console.log("✅ Remote stream set on video element");
        } else {
          console.warn("⚠️ remoteVideoRef is not set");
        }
      }
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, streamRef.current as MediaStream);
      });
    }

    peerConnectionRef.current = pc;
  };

  const handleJoinMeeting = async () => {
    if (!user?.userId || !meetingId) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Your browser does not support accessing camera/microphone or you're not on a secure connection (HTTPS)."
      );
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    try {
      const res = await fetch("http://localhost:4000/api/meeting/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: meetingId,
          userId: Number(user.userId),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Successfully joined the meeting.");
        setHasJoined(true);
        setupSocketAfterStream();
        const detailRes = await fetch(
          `http://localhost:4000/api/meeting/details/${meetingId}`
        );
        const detailData = await detailRes.json();
        if (detailRes.ok && Array.isArray(detailData.meeting.participants)) {
          const filtered = detailData.meeting.participants.filter(
            (participant: any) => participant.hasJoined
          );
          setJoinedUsers(filtered);
        }
      } else {
        alert(`Join failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Join failed", err);
    }
  };
  // Setup socket and signaling after stream is acquired and user has joined meeting
  const setupSocketAfterStream = () => {
    if (!meetingNoId || !user?.userId) return;

    socket.current = io("http://localhost:4000", {
      transports: ["websocket"],
    });

    socket.current.on("participants-updated", (updatedUsers: any[]) => {
      setJoinedUsers(updatedUsers);

      const otherUser = updatedUsers.find((u) => u.id !== Number(user?.userId));
      if (otherUser) {
        setOtherSocketId(otherUser.socketId);
        otherSocketIdRef.current = otherUser.socketId; // Update the ref
      } else {
        otherSocketIdRef.current = null; // Clear the ref if they leave
      }
    });

    socket.current.on(
      "offer",
      async ({ offer, from }: { offer: any; from: any }) => {
        console.log("📨 Offer received from:", from);
        if (!peerConnectionRef.current)
          createPeerConnection(socket.current, from);
        await peerConnectionRef.current?.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnectionRef.current?.createAnswer();
        await peerConnectionRef.current?.setLocalDescription(answer);
        socket.current.emit("answer", { answer, to: from });
      }
    );

    socket.current.on(
      "answer",
      async ({ answer, from }: { answer: any; from: any }) => {
        await peerConnectionRef.current?.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    );

    socket.current.on(
      "ice-candidate",
      async ({ candidate }: { candidate: any }) => {
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(candidate);
          } catch (e) {
            console.error("❌ Failed to add ICE candidate", e);
          }
        }
      }
    );

    socket.current.on("start-call", async ({ to }: { to: any }) => {
      if (!peerConnectionRef.current) createPeerConnection(socket.current, to);
      const offer = await peerConnectionRef.current?.createOffer();
      await peerConnectionRef.current?.setLocalDescription(offer);
      socket.current.emit("offer", { offer, to });
    });

    socket.current.on("meeting-ended", ({ durationMs }: { durationMs: number }) => {
      console.log("📏 Meeting duration received:", durationMs);
      setDuration(durationMs);
    });

    socket.current.emit("join-meeting", {
      meetingNoId,
      user: {
        userId: user.userId,
        username: user.username,
      },
    });

    setTimeout(() => {
      const targetSocketId = otherSocketIdRef.current;
      socket.current?.emit("start-call", { to: targetSocketId ?? null });
    }, 500);
  };

  const startRecording = async () => {
    setStatus("Requesting permissions...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      setStatus("Recording...");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const options = { mimeType: "video/webm; codecs=vp8,opus" };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.onstop = () => {
        setStatus("MediaRecorder stopped unexpectedly");
      };

      recorder.onerror = (e) => {
        console.error("Recorder error:", e.error);
      };

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const chunk = event.data;
          const formData = new FormData();
          formData.append(
            "chunk",
            chunk,
            `chunk-${chunkIndexRef.current}.webm`
          );
          formData.append("meetingId", meetingId);
          formData.append("userId", user?.userId!);
          formData.append("chunkIndex", chunkIndexRef.current.toString());

          try {
            await fetch("http://localhost:4000/api/upload", {
              method: "POST",
              body: formData,
            });
            console.log(`Chunk ${chunkIndexRef.current} uploaded.`);
            chunkIndexRef.current += 1;
            setChunkStatuses((prev) => [
              ...prev,
              `✅ Chunk ${chunkIndexRef.current - 1} uploaded successfully`,
            ]);
            console.log("🔍 Chunk uploaded. Size:", chunk.size);
          } catch (err) {
            console.error("Upload failed", err);
          }
        }
      };

      recorder.start(uploadInterval);
      setIsRecording(true);
    } catch (err) {
      console.error("Could not start recording", err);
      setStatus("Error starting recording");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.requestData();

    setTimeout(() => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setStatus("Recording stopped");
    }, 1000);
  };

  const mergeMyChunks = async () => {
    if (!user?.userId || !meetingId) return;
    const res = await fetch("http://localhost:4000/api/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, userId: user.userId }),
    });
    const result = await res.json();
    alert(result.message || "Merge triggered.");
  };

  const mergeSideBySide = async () => {
    setMergeLog("Merging side-by-side...");
    try {
      const res = await fetch("http://localhost:4000/api/merge/side-by-side", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          userA: user?.userId,
          userB: selectedPartner ?? "",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMergeLog(` Side-by-side merge successful: ${data.output}`);
      } else {
        setMergeLog(` Side-by-side merge failed: ${data.error}`);
      }
    } catch (error) {
      setMergeLog(" Error during side-by-side merge.");
    }
  };

  if (!meetingId) return <div>Invalid Meeting ID</div>;

  if (!hasHydrated) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Meeting ID: {meetingId}</h1>
      <p className="text-lg mb-2">User ID: {user?.userId ?? "Loading..."}</p>
      <div className="mb-4">
        <h2 className="text-white font-semibold">Participants:</h2>
        <ul className="text-sm text-gray-400 list-none list-inside">
          {(hasJoined
            ? Array.from(
                new Map(
                  [
                    ...joinedUsers,
                    { id: Number(user?.userId), username: user?.username },
                  ].map((u) => [u.id, u])
                ).values()
              )
            : initialParticipants
          ).map((user) => (
            <li key={user.id}>{user.username}</li>
          ))}
        </ul>
      </div>
      <button
        onClick={handleJoinMeeting}
        disabled={!user?.userId}
        className="bg-yellow-600 px-4 py-2 rounded hover:bg-yellow-700 mb-4"
      >
        Join Meeting
      </button>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-[320px] h-[240px] bg-gray-700 rounded-md mb-4"
      />
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-[320px] h-[240px] bg-gray-700 rounded-md mb-4"
      />

      <p className="mb-4 text-gray-300">Status: {status}</p>

      <div className="mb-4 w-full max-w-md">
        <h2 className="font-medium text-white">Chunk Upload Status</h2>
        <ul className="text-sm text-gray-400 list-disc list-inside max-h-40 overflow-y-auto border border-gray-700 p-2 rounded bg-gray-900">
          {chunkStatuses.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
          >
            Stop Recording
          </button>
        )}

        <button
          onClick={mergeMyChunks}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Merge My Chunks
        </button>
      </div>

      <div className="mt-6 w-full max-w-md">
        <h2 className="font-medium text-white mb-2">Side-by-Side Merge</h2>
        <select
          className="border px-3 py-2 rounded w-full text-black mb-2"
          value={selectedPartner ?? ""}
          onChange={(e) => setSelectedPartner(e.target.value)}
        >
          <option value="" disabled>
            Select partner
          </option>
          {joinedUsers
            .filter((p) => p.id !== Number(user?.userId))
            .map((partner) => (
              <option
                key={partner.id}
                className="text-red-500"
                value={partner.id}
              >
                {partner.username}
              </option>
            ))}
        </select>
        <button
          onClick={mergeSideBySide}
          className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 w-full"
          disabled={!selectedPartner}
        >
          Merge Side-by-Side
        </button>
        <p className="text-gray-300 mt-2 whitespace-pre-wrap">{mergeLog}</p>
      </div>
      {hasJoined && (
        <div className="mt-4">
          {isHost ? (
            <button
              onClick={handleEndMeeting}
              className="bg-red-700 px-4 py-2 rounded hover:bg-red-800"
            >
              End Meeting
            </button>
          ) : (
            <button
              onClick={handleLeaveMeeting}
              className="bg-yellow-700 px-4 py-2 rounded hover:bg-yellow-800"
            >
              Leave Meeting
            </button>
          )}
        </div>
      )}
      {duration && (
        <p className="text-white mt-4 text-lg">
          Meeting Duration: {(duration / 1000).toFixed(0)} seconds
        </p>
      )}
    </div>
  );
};

export default MeetingPage;
