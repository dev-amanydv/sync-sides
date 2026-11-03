"use client";

// The meeting orchestrator: Socket.IO lifecycle, the single 1:1 peer
// connection, MediaRecorder capture + live chunk upload, chat, and media
// state. Everything mutable lives in refs so the connection effect runs once
// per live session and never churns on React state changes.

import { useCallback, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { uploadChunk } from "@/lib/meeting/api";
import type {
  ChatMessage,
  MeetingDetails,
  Participant,
  SessionUser,
} from "@/lib/meeting/types";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const TIMESLICE_MS = 3000;
const VIDEO_BITS_PER_SECOND = 1_200_000;

// Hard cap on recording length. Mirrors MAX_RECORDING_MS on the backend, which
// is the real enforcer — this is a client-side backstop so a MediaRecorder
// keeps flushing/stopping even if the socket has dropped.
export const MAX_RECORDING_MS = 5 * 60 * 1000;

interface Options {
  active: boolean;
  meeting: MeetingDetails;
  user: SessionUser;
  isHost: boolean;
  stream: MediaStream | null;
  autoRecord: boolean;
  initialMuted?: boolean;
  initialVideoOff?: boolean;
}

export interface MeetingSession {
  participants: Participant[];
  remoteStream: MediaStream | null;
  remoteConnected: boolean;
  remoteLeft: boolean;
  isRecording: boolean;
  recordingMs: number; // elapsed recording time, for the 5-min countdown
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  ended: boolean;
  durationMs: number;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  sendMessage: (text: string) => void;
  endMeeting: () => void;
  leave: () => void;
  markChatRead: () => void;
}

export function useMeetingSession(opts: Options): MeetingSession {
  const { active, meeting, user, isHost, stream, autoRecord } = opts;
  const initialMuted = opts.initialMuted ?? false;
  const initialVideoOff = opts.initialVideoOff ?? false;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteConnected, setRemoteConnected] = useState(false);
  // True once a remote peer has been present and has since left, so the UI can
  // show "left the meeting" rather than the initial "waiting to connect" state.
  const [remoteLeft, setRemoteLeft] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isVideoOff, setIsVideoOff] = useState(initialVideoOff);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ended, setEnded] = useState(false);
  const [durationMs, setDurationMs] = useState(0);

  // Refs mirror the props/state the socket handlers need without re-binding.
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const hadRemoteRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const signaledReadyRef = useRef(false);

  const streamRef = useRef(stream);
  streamRef.current = stream;
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingClockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingCapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chunkIndexRef = useRef(0);
  const pendingUploadsRef = useRef<Promise<unknown>[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const autoRecordRef = useRef(autoRecord);
  autoRecordRef.current = autoRecord;
  const autoStartedRef = useRef(false);
  const appliedInitialMediaRef = useRef(false);
  const joinedAtRef = useRef(0);

  // --- Peer connection ---------------------------------------------------
  const getPeer = useCallback((): RTCPeerConnection => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && remoteSocketIdRef.current) {
        socketRef.current?.emit("ice-candidate", {
          candidate: e.candidate,
          to: remoteSocketIdRef.current,
        });
      }
    };

    pc.ontrack = (e) => {
      if (e.streams[0]) {
        setRemoteStream(e.streams[0]);
        setRemoteConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setRemoteConnected(true);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setRemoteConnected(false);
      }
    };

    streamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, streamRef.current as MediaStream);
    });

    pcRef.current = pc;
    return pc;
  }, []);

  const flushCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const c of pendingCandidatesRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }
    pendingCandidatesRef.current = [];
  }, []);

  // --- Recording ---------------------------------------------------------
  const stopRecordingClock = useCallback(() => {
    if (recordingClockRef.current) clearInterval(recordingClockRef.current);
    recordingClockRef.current = null;
    if (recordingCapRef.current) clearTimeout(recordingCapRef.current);
    recordingCapRef.current = null;
  }, []);

  const beginRecorder = useCallback(() => {
    if (recorderRef.current || !streamRef.current) return;
    chunkIndexRef.current = 0;
    pendingUploadsRef.current = [];

    // Recording clock + client-side 5-min hard cap. The server enforces the
    // same limit; this keeps the local recorder from running on past it if the
    // socket has dropped.
    const startedAt = Date.now();
    setRecordingMs(0);
    stopRecordingClock();
    recordingClockRef.current = setInterval(() => {
      setRecordingMs(Math.min(Date.now() - startedAt, MAX_RECORDING_MS));
    }, 1000);
    recordingCapRef.current = setTimeout(() => {
      setIsRecording(false);
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") rec.stop(); // flushes + emits recording-uploaded
    }, MAX_RECORDING_MS);

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp8,opus",
      videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size === 0) return;
      const index = chunkIndexRef.current++;
      pendingUploadsRef.current.push(
        uploadChunk(meeting.meetingId, user.userId, index, e.data).catch((err) =>
          console.error("Chunk upload failed:", err)
        )
      );
    };

    recorder.onstop = async () => {
      stopRecordingClock();
      // Wait for every chunk (including the final flush) to finish uploading,
      // then tell the server this side is fully uploaded.
      await Promise.allSettled(pendingUploadsRef.current);
      socketRef.current?.emit("recording-uploaded");
      recorderRef.current = null;
    };

    recorder.start(TIMESLICE_MS);
    recorderRef.current = recorder;
  }, [meeting.meetingId, user.userId, stopRecordingClock]);

  const endRecorder = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop(); // flushes a final chunk, then onstop emits recording-uploaded
    }
  }, []);

  // --- Socket lifecycle (runs once per live session) ---------------------
  useEffect(() => {
    if (!active) return;

    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL as string, {
      transports: ["websocket"],
    });
    socketRef.current = socket;
    joinedAtRef.current = Date.now();

    socket.on("connect", () => {
      socket.emit("join-meeting", {
        meetingNoId: meeting.id,
        user: { userId: user.userId, email: user.email, name: user.name },
      });
    });

    socket.on("participants-updated", (list: Participant[]) => {
      setParticipants(list);
      const remote = list.find((p) => p.id !== Number(user.userId));
      if (remote?.socketId) {
        remoteSocketIdRef.current = remote.socketId;
        hadRemoteRef.current = true;
        setRemoteLeft(false);
        // Only the guest kicks off signaling; the host answers with an offer.
        if (!isHostRef.current && !signaledReadyRef.current) {
          signaledReadyRef.current = true;
          socket.emit("client-ready");
        }
      } else {
        // Remote left — tear the peer down so the stale (now frozen) frame is
        // cleared and a rejoin re-triggers a clean handshake.
        remoteSocketIdRef.current = null;
        signaledReadyRef.current = false;
        remoteDescSetRef.current = false;
        pendingCandidatesRef.current = [];
        pcRef.current?.close();
        pcRef.current = null;
        setRemoteStream(null);
        setRemoteConnected(false);
        // Only flag as "left" if someone had actually been here.
        if (hadRemoteRef.current) setRemoteLeft(true);
      }
    });

    // Host side: guest is ready → send an offer.
    socket.on("client-ready", async ({ fromSocketId }: { fromSocketId: string }) => {
      if (!isHostRef.current) return;
      remoteSocketIdRef.current = fromSocketId;
      const pc = getPeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { offer, to: fromSocketId });
    });

    // Guest side: got an offer → answer.
    socket.on("offer", async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
      remoteSocketIdRef.current = from;
      const pc = getPeer();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      remoteDescSetRef.current = true;
      await flushCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { answer, to: from });
    });

    socket.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      remoteDescSetRef.current = true;
      await flushCandidates();
    });

    socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!remoteDescSetRef.current) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    socket.on("chat-message", ({ message }: { message: ChatMessage }) => {
      setMessages((prev) => [...prev, message]);
      setUnreadCount((n) => n + 1);
    });

    socket.on("media-state", ({ userId: uid, isMuted: m, isVideoOff: v }: { userId: number; isMuted: boolean; isVideoOff: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === uid ? { ...p, isMuted: m, isVideoOff: v } : p))
      );
    });

    socket.on("recording-started", () => {
      setIsRecording(true);
      beginRecorder();
    });

    socket.on("recording-stopped", () => {
      setIsRecording(false);
      endRecorder();
    });

    socket.on("meeting-ended", ({ durationMs: d }: { durationMs: number }) => {
      setDurationMs(d);
      setEnded(true);
    });

    return () => {
      endRecorder();
      stopRecordingClock();
      socket.disconnect();
      socketRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      remoteDescSetRef.current = false;
      signaledReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, meeting.id]);

  // Apply the user's join-with-mic/camera preferences to the real tracks once,
  // when the meeting goes live. Done here (not on toggle) so the control-bar
  // state and the actual track.enabled flag never drift apart.
  useEffect(() => {
    if (!active || appliedInitialMediaRef.current) return;
    const s = streamRef.current;
    if (!s) return;
    appliedInitialMediaRef.current = true;
    const audio = s.getAudioTracks()[0];
    if (audio) audio.enabled = !initialMuted;
    const video = s.getVideoTracks()[0];
    if (video) video.enabled = !initialVideoOff;
  }, [active, stream, initialMuted, initialVideoOff]);

  // Auto-record: once the guest's video is connected, the host auto-starts.
  useEffect(() => {
    if (
      active &&
      isHost &&
      autoRecordRef.current &&
      remoteConnected &&
      !isRecording &&
      !autoStartedRef.current
    ) {
      autoStartedRef.current = true;
      socketRef.current?.emit("recording-start");
    }
  }, [active, isHost, remoteConnected, isRecording]);

  // --- Actions -----------------------------------------------------------
  const startRecording = useCallback(() => {
    if (isHostRef.current) socketRef.current?.emit("recording-start");
  }, []);

  const stopRecording = useCallback(() => {
    if (isHostRef.current) socketRef.current?.emit("recording-stop");
  }, []);

  const broadcastMediaState = useCallback((muted: boolean, videoOff: boolean) => {
    socketRef.current?.emit("media-state", { isMuted: muted, isVideoOff: videoOff });
  }, []);

  const toggleMute = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const muted = !track.enabled;
    setIsMuted(muted);
    setIsVideoOff((v) => {
      broadcastMediaState(muted, v);
      return v;
    });
  }, [broadcastMediaState]);

  const toggleVideo = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const videoOff = !track.enabled;
    setIsVideoOff(videoOff);
    setIsMuted((m) => {
      broadcastMediaState(m, videoOff);
      return m;
    });
  }, [broadcastMediaState]);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
    if (!isScreenSharing) {
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = display.getVideoTracks()[0];
        if (!screenTrack) return;
        screenStreamRef.current = display;
        await sender?.replaceTrack(screenTrack);
        screenTrack.onended = () => void restoreCamera();
        setIsScreenSharing(true);
      } catch {
        /* user cancelled the picker */
      }
    } else {
      await restoreCamera();
    }

    async function restoreCamera() {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const camTrack = streamRef.current?.getVideoTracks()[0];
      if (camTrack) await sender?.replaceTrack(camTrack);
      setIsScreenSharing(false);
    }
  }, [isScreenSharing]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        userId: user.userId,
        userName: user.name || user.email.split("@")[0] || "You",
        message: trimmed,
        timestamp: Date.now(),
      };
      socketRef.current?.emit("chat-message", { message });
      setMessages((prev) => [...prev, message]);
    },
    [user]
  );

  const endMeeting = useCallback(() => {
    socketRef.current?.emit("end-meeting");
  }, []);

  const leave = useCallback(() => {
    // A guest leaving flushes any recording, then disconnects so the host is
    // told they've left (chunk uploads are plain fetches and continue anyway).
    endRecorder();
    setDurationMs(Date.now() - joinedAtRef.current);
    setEnded(true);
    socketRef.current?.disconnect();
  }, [endRecorder]);

  const markChatRead = useCallback(() => setUnreadCount(0), []);

  return {
    participants,
    remoteStream,
    remoteConnected,
    remoteLeft,
    isRecording,
    recordingMs,
    isMuted,
    isVideoOff,
    isScreenSharing,
    messages,
    unreadCount,
    ended,
    durationMs,
    startRecording,
    stopRecording,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    endMeeting,
    leave,
    markChatRead,
  };
}
