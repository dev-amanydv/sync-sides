"use client";

import io, { Socket } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  MicrophoneIcon, 
  VideoCameraIcon, 
  PhoneIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  SpeakerWaveIcon,
  XMarkIcon,
  ClockIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
  PresentationChartBarIcon,
  HandRaisedIcon
} from "@heroicons/react/24/outline";
import { 
  MicrophoneIcon as MicrophoneIconSolid,
  VideoCameraIcon as VideoCameraIconSolid,
  SpeakerWaveIcon as SpeakerWaveIconSolid,
  VideoCameraSlashIcon,
  SpeakerXMarkIcon
} from "@heroicons/react/24/solid";

// Types
interface User {
  userId: string;
  fullname: string;
  email: string;
  profilePic: string;
}

interface Participant {
  id: number;
  email: string;
  socketId?: string;
  hasJoined: boolean;
  name?: string;
  profilePic?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean; 
}

interface MeetingDetails {
  id: string;
  hostId: number;
  participants: Participant[];
  title?: string;
  startTime?: string;
}

interface ChunkStatus {
  index: number;
  status: 'uploading' | 'success' | 'error';
  message: string;
  timestamp: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

// Utility Functions
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const MeetingPage = () => {
  const params = useParams();
  const router = useRouter();
  const {  data: session } = useSession();
  
  // User and Meeting State
  const [user, setUser] = useState<User>({
    userId: "",
    fullname: "",
    email: "",
    profilePic: ""
  });
  
  const meetingId = params?.id as string;
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [joinedUsers, setJoinedUsers] = useState<Participant[]>([]);
  const [duration, setDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  
  // Media and Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [chunkStatuses, setChunkStatuses] = useState<ChunkStatus[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | undefined>(undefined);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  
  // UI State
  const [showMeetingUI, setShowMeetingUI] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Refs
  const socket = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chunkIndexRef = useRef(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const otherSocketIdRef = useRef<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastToastRef = useRef<{ message: string; time: number } | null>(null);
  // In page.tsx, add this with your other refs
const hasSignaledReadiness = useRef(false);
  
  // Constants
  const UPLOAD_INTERVAL = 5000;
  const CONTROLS_HIDE_DELAY = 20000;
  const RECONNECT_DELAY = 2000;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Enhanced Toast Management
  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info', duration = 5000) => {
    const now = Date.now();
    
    // Prevent duplicate toasts within 2 seconds
    if (lastToastRef.current && 
        lastToastRef.current.message === message && 
        now - lastToastRef.current.time < 2000) {
      return;
    }
    
    lastToastRef.current = { message, time: now };
    
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Clear existing timeout if toast with same message exists
    const existingToast = toasts.find(t => t.message === message && t.type === type);
    if (existingToast) {
      const existingTimeout = toastTimeoutsRef.current.get(existingToast.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        toastTimeoutsRef.current.delete(existingToast.id);
      }
      setToasts(prev => prev.filter(toast => toast.id !== existingToast.id));
    }
    
    // Add new toast
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    // Set timeout for auto-removal
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
      toastTimeoutsRef.current.delete(id);
    }, duration);
    
    toastTimeoutsRef.current.set(id, timeoutId);
  }, [toasts]);

  useEffect(()=> {
    console.log("setting... up local mediaStream")
    const startLocalMedia = async () => {
      const stream = await setupMediaStream();
      setLocalStream(stream);
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
     }
    startLocalMedia();
    console.log("setted up local mediaStream")
  }, [])

  const removeToast = useCallback((id: string) => {
    const timeoutId = toastTimeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      toastTimeoutsRef.current.delete(id);
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    toastTimeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    toastTimeoutsRef.current.clear();
    setToasts([]);
  }, []);

  // Debounced Toast for Frequently Triggered Events
  const debouncedToast = useCallback(
    debounce((message: string, type: ToastMessage['type'] = 'info') => {
      addToast(message, type, 2000);
    }, 1000),
    [addToast]
  );

  // Session Management
  useEffect(() => {
    if (session?.user) {
      setUser({
        userId: session.user.id ?? "",
        fullname: session.user.name ?? "",
        email: session.user.email ?? "",
        profilePic: session.user.image ?? "",
      });
    }
  }, [session]);

  // Fetch Meeting Details
  useEffect(() => {
    const fetchMeetingDetails = async () => {
      if (!meetingId) return;
      
      setIsLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meeting/details/${meetingId}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch meeting details: ${res.status}`);
        }
        
        const data = await res.json();
        setMeetingDetails(data.meeting);
        
        if (user?.userId && Number(user.userId) === data.meeting.hostId) {
          setIsHost(true);
        }
        
        const joinedParticipants = data.meeting.participants.filter(
          (p: Participant) => p.hasJoined
        );
        setJoinedUsers(joinedParticipants);
        
      } catch (error: any) {
        console.error("Failed to fetch meeting details:", error);
        if (error.name === 'AbortError') {
          addToast("Request timed out. Please check your connection.", "error");
        } else {
          addToast("Failed to load meeting details", "error");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingDetails();
  }, [meetingId, user.userId, addToast]);

  // Enhanced WebRTC Setup
  const createPeerConnection = useCallback((targetSocketId: string) => {
    console.log("Creating peer connection for:", targetSocketId);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" }
      ],
      iceCandidatePoolSize: 10,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket.current) {
        console.log("Sending ICE candidate:", event.candidate.type);
        socket.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: targetSocketId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log("Setting remote stream");
        setRemoteStream(event.streams[0]);
        setConnectionStatus('connected');
        addToast("Video connection established", "success");
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state changed:", pc.connectionState);
      switch (pc.connectionState) {
        case 'connecting':
          setConnectionStatus('connecting');
          break;
        case 'connected':
          setConnectionStatus('connected');
          setReconnectAttempts(0);
          addToast("Connected successfully", "success");
          break;
        case 'disconnected':
          setConnectionStatus('disconnected');
          addToast("Connection lost", "warning");
          break;
        case 'failed':
          setConnectionStatus('failed');
          addToast("Connection failed. Attempting to reconnect...", "error");
          handleReconnect(targetSocketId);
          break;
        case 'closed':
          setConnectionStatus('disconnected');
          break;
      }
    };

    // Add local stream if available
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log("Adding track to peer connection:", track.kind);
        pc.addTrack(track, streamRef.current as MediaStream);
      });
    } else {
      console.log("localstream is not available")
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [addToast]);

  // Handle Reconnection
  const handleReconnect = useCallback((targetSocketId: string) => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      addToast("Maximum reconnection attempts reached", "error");
      return;
    }

    setReconnectAttempts(prev => prev + 1);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      createPeerConnection(targetSocketId);
      initiateCall(targetSocketId);
    }, RECONNECT_DELAY * (reconnectAttempts + 1));
  }, [reconnectAttempts, createPeerConnection]);

  // Initiate Call
  const initiateCall = useCallback(async (targetSocketId?: string) => {
    const socketId = targetSocketId || otherSocketIdRef.current;
    if (!socketId || !socket.current) return;

    try {
      if (!peerConnectionRef.current) {
        createPeerConnection(socketId);
      }

      console.log("Creating offer...");
      const offer = await peerConnectionRef.current?.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });

      if (offer) {
        await peerConnectionRef.current?.setLocalDescription(offer);
        console.log("Sending offer to:", socketId);
        socket.current.emit("offer", { offer, to: socketId });
      }
    } catch (error) {
      console.error("Error initiating call:", error);
      addToast("Failed to initiate call", "error");
    }
  }, [createPeerConnection, addToast]);

  // Enhanced Socket Setup
  const setupSocket = useCallback(() => {
    if (!meetingDetails || !user?.userId) return;

    console.log("Setting up socket connection...");
    
    socket.current = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.current.on("connect", () => {
      console.log("Socket connected successfully");
      setConnectionStatus('connecting');
      addToast("Connected to meeting server", "success");
    });

    socket.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      hasSignaledReadiness.current = false;
      setConnectionStatus('disconnected');
      addToast("Disconnected from meeting server", "warning");
    });

    socket.current.on("participants-updated", (updatedUsers: Participant[]) => {
      console.log("Participants updated:", updatedUsers);
      // Merge new user data with existing state to preserve hand-raise, etc.
      // IMPROVEMENT
setJoinedUsers(prevUsers => {
  const userMap = new Map(prevUsers.map(u => [u.id, u]));
  return updatedUsers.map(newUser => {
    const existingUser = userMap.get(newUser.id);
    // Return the existing user's state merged with new data,
    // or just the new user if they are brand new.
    return existingUser ? { ...existingUser, ...newUser } : newUser;
  });
});
    
      const otherUser = updatedUsers.find(u => u.id !== Number(user?.userId));
    
      if (otherUser && otherUser.socketId) {
        // Guest signals readiness to the host, but only once.
        if (!isHost && meetingDetails && !hasSignaledReadiness.current) {
          hasSignaledReadiness.current = true; // Set the flag
          console.log("I am the guest, signaling readiness for the first time.");
          socket.current?.emit("client-ready", { 
            meetingNoId: meetingDetails.id, 
            fromSocketId: socket.current.id 
          });
        }
      }
    });

    socket.current.on("offer", async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log("Received offer from:", from);
      try {
        if (!peerConnectionRef.current) {
          createPeerConnection(from);
        }
        
        await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("Remote description set, creating answer...");
        
        const answer = await peerConnectionRef.current?.createAnswer();
        if (answer) {
          await peerConnectionRef.current?.setLocalDescription(answer);
          console.log("Sending answer to:", from);
          socket.current?.emit("answer", { answer, to: from });
        }
      } catch (error) {
        console.error("Error handling offer:", error);
        addToast("Failed to establish connection", "error");
      }
    });

    socket.current.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("Received answer");
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("Remote description set for answer");
        }
      } catch (error) {
        console.error("Error handling answer:", error);
        addToast("Connection setup failed", "error");
      }
    });

    // IMPROVEMENT
socket.current.on("ice-candidate", async ({ candidate }) => {
  try {
    if (peerConnectionRef.current) { // Just check if the peer connection exists
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("ICE candidate added successfully");
    }
  } catch (error: any) {
    // It's common to see "Error: Cannot add ICE candidate when there is no remote SDP"
    // This is usually not fatal, so you might want to suppress the log for this specific error.
    if (!error.message.includes("remote SDP")) {
      console.error("Error adding ICE candidate:", error);
    }
  }
});
    socket.current.on("meeting-ended", ({ durationMs }: { durationMs: number }) => {
      console.log("Meeting ended with duration:", durationMs);
      setDuration(durationMs);
      addToast("Meeting has ended", "info");
      cleanup();
      router.push('/dashboard');
    });

    socket.current.on("chat-message", ({ message }: { message: ChatMessage }) => {
      setChatMessages(prev => [...prev, message]);
      if (!showChat) {
        setUnreadMessages(prev => prev + 1);
        addToast(`${message.userName}: ${message.message}`, "info");
      }
    });

    // Add this inside setupSocket() in page.tsx, e.g., after the "chat-message" listener
if (isHost) {
  socket.current.on("client-ready", ({ fromSocketId }: { fromSocketId: string }) => {
    console.log("Host received client-ready from:", fromSocketId);
    initiateCall(fromSocketId);
  });
}
    socket.current.on("participant-muted", ({ userId, isMuted }: { userId: string; isMuted: boolean }) => {
      setJoinedUsers(prev => prev.map(user => 
        user.id === Number(userId) ? { ...user, isMuted } : user
      ));
    });

    socket.current.on("participant-video-toggled", ({ userId, isVideoOff }: { userId: string; isVideoOff: boolean }) => {
      setJoinedUsers(prev => prev.map(user => 
        user.id === Number(userId) ? { ...user, isVideoOff } : user
      ));
    });
    // Add this to setupSocket() in page.tsx
socket.current.on("hand-raised", ({ userId, isHandRaised }: { userId: string; isHandRaised: boolean }) => {
  setJoinedUsers(prev => 
    prev.map(user => 
      user.id === Number(userId) ? { ...user, isHandRaised } : user
    )
  );
});

    socket.current.emit("join-meeting", {
      meetingNoId: meetingDetails.id,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.fullname,
        profilePic: user.profilePic,
      },
    });

  }, [meetingDetails, user, createPeerConnection, addToast, router, showChat, initiateCall]);

  // Enhanced Media Stream Setup
  const setupMediaStream = useCallback(async () => {
    try {
      console.log("Setting up media stream...");
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, max: 1920 }, 
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });
      
      console.log("Media stream obtained:", stream.getTracks().map(t => t.kind));
      streamRef.current = stream;

      return stream;
    } catch (error: any) {
      console.error("Error accessing media devices:", error);
      let errorMessage = "Failed to access camera/microphone";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera/microphone access denied. Please allow permissions.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera/microphone found.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera/microphone already in use.";
      }
      
      addToast(errorMessage, "error");
      throw error;
    }
  }, [addToast]);

  // Join Meeting
  const handleJoinMeeting = useCallback(async () => {
    if (!user?.userId || !meetingId) return;

    setIsLoading(true);
    try {
      const stream = await setupMediaStream();
      setLocalStream(stream);


      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meeting/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: meetingId,
          userId: Number(user.userId),
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Join failed: ${res.status}`);
      }

      setHasJoined(true);
      setShowMeetingUI(true);
      setupSocket();
      
      addToast("Successfully joined the meeting", "success");
      
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setDuration(Date.now() - startTime);
      }, 1000);

    } catch (error: any) {
      console.error("Join meeting error:", error);
      let errorMessage = "Failed to join meeting";
      
      if (error.name === 'AbortError') {
        errorMessage = "Join request timed out. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addToast(errorMessage, "error");
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, meetingId, setupMediaStream, setupSocket, addToast]);

  // Media Controls
  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        
        // Emit to other participants
        socket.current?.emit("participant-muted", {
          userId: user.userId,
          isMuted: !audioTrack.enabled
        });
        
        debouncedToast(audioTrack.enabled ? "Microphone unmuted" : "Microphone muted", "info");
      }
    }
  }, [user.userId, debouncedToast]);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        
        // Emit to other participants
        socket.current?.emit("participant-video-toggled", {
          userId: user.userId,
          isVideoOff: !videoTrack.enabled
        });
        
        debouncedToast(videoTrack.enabled ? "Camera turned on" : "Camera turned off", "info");
      }
    }
  }, [user.userId, debouncedToast]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(!isSpeakerOn);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOn;
    }
    debouncedToast(isSpeakerOn ? "Speaker muted" : "Speaker unmuted", "info");
  }, [isSpeakerOn, debouncedToast]);

  // Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        addToast("Screen sharing not supported in this browser", "error");
        return;
      }
  
      if (!isScreenSharing) {
        
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor",
          } ,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          }
        } as any);
        
        screenStreamRef.current = screenStream;
        
        // Replace video track in peer connection
        if (peerConnectionRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0] as MediaStreamTrack;
          const videoSender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (videoSender) {
            await videoSender.replaceTrack(videoTrack);
          }
  
          // Handle audio track if available
          const audioTrack = screenStream.getAudioTracks()[0];
          if (audioTrack) {
            const audioSender = peerConnectionRef.current.getSenders().find(s => 
              s.track && s.track.kind === 'audio'
            );
            if (audioSender) {
              await audioSender.replaceTrack(audioTrack);
            }
          }
        }
        
        // Update local video display
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        addToast("Screen sharing started", "success");
        
        // Handle screen share end
        const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }
        
        // Optional: Handle audio track end
        const audioTrack = screenStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.onended = () => {
            // Handle audio track ending if needed
            console.log("Screen share audio ended");
          };
        }
        
      } else {
        stopScreenShare();
      }
    } catch (error :any) {
      console.error("Screen sharing error:", error);
      
      let errorMessage = "Failed to start screen sharing";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Screen sharing permission denied";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No screen available for sharing";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Screen sharing not supported in this browser";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Screen is already being captured";
      }
      
      addToast(errorMessage, "error");
    }
  }, [isScreenSharing, addToast]);
  

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    // Replace back to camera
    if (peerConnectionRef.current && streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    }
    
    setIsScreenSharing(false);
    addToast("Screen sharing stopped", "info");
  }, [addToast]);

  // Hand Raise
  const toggleHandRaise = useCallback(() => {
    setIsHandRaised(!isHandRaised);
    socket.current?.emit("hand-raised", {
      userId: user.userId,
      isHandRaised: !isHandRaised
    });
    addToast(isHandRaised ? "Hand lowered" : "Hand raised", "info");
  }, [isHandRaised, user.userId, addToast]);

  // Recording Functions
  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      addToast("No media stream available for recording", "error");
      return;
    }

    try {
      const options = { mimeType: "video/webm; codecs=vp8,opus" };
      const recorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const chunk = event.data;
          const chunkIndex = chunkIndexRef.current;
          
          const chunkStatus: ChunkStatus = {
            index: chunkIndex,
            status: 'uploading',
            message: `Uploading chunk ${chunkIndex}...`,
            timestamp: Date.now()
          };

          setChunkStatuses(prev => [...prev, chunkStatus]);

          const formData = new FormData();
          formData.append("chunk", chunk, `chunk-${chunkIndex}.webm`);
          formData.append("meetingId", meetingId);
          formData.append("userId", user.userId);
          formData.append("chunkIndex", chunkIndex.toString());

          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              setChunkStatuses(prev => 
                prev.map(cs => 
                  cs.index === chunkIndex 
                    ? { ...cs, status: 'success', message: `Chunk ${chunkIndex} uploaded successfully` }
                    : cs
                )
              );
            } else {
              throw new Error(`Upload failed: ${response.status}`);
            }
          } catch (error) {
            console.error("Upload failed:", error);
            setChunkStatuses(prev => 
              prev.map(cs => 
                cs.index === chunkIndex 
                  ? { ...cs, status: 'error', message: `Failed to upload chunk ${chunkIndex}` }
                  : cs
              )
            );
          }
          
          chunkIndexRef.current += 1;
        }
      };

      recorder.start(UPLOAD_INTERVAL);
      setIsRecording(true);
      addToast("Recording started", "success");
    } catch (error) {
      console.error("Recording error:", error);
      addToast("Failed to start recording", "error");
    }
  }, [meetingId, user.userId, addToast]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    try {
      mediaRecorderRef.current.requestData();
      setTimeout(() => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        addToast("Recording stopped", "info");
      }, 1000);
    } catch (error) {
      console.error("Error stopping recording:", error);
      addToast("Error stopping recording", "error");
    }
  }, [addToast]);

  // Meeting Controls
  const handleLeaveMeeting = useCallback(() => {
    addToast("Leaving meeting...", "info");
    cleanup();
    router.push('/dashboard');
  }, [router]);

  const handleEndMeeting = useCallback(async () => {
    if (!isHost) {
      addToast("Only the host can end the meeting", "error");
      return;
    }

    setIsLoading(true);
    let retryCount = 0;
    const maxRetries = 3;

    const attemptEndMeeting = async () => {
      try {
        addToast("Meeting ended successfully", "success");
        cleanup();
        router.push('/dashboard');
        
      } catch (error: any) {
        console.error(`End meeting attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries && error.name !== 'AbortError') {
          retryCount++;
          addToast(`Retrying... (${retryCount}/${maxRetries})`, "info");
          setTimeout(attemptEndMeeting, 2000 * retryCount);
        } else {
          let errorMessage = "Failed to end meeting";
          if (error.name === 'AbortError') {
            errorMessage = "End meeting request timed out";
          } else if (error.message) {
            errorMessage = error.message;
          }
          addToast(errorMessage, "error");
          setIsLoading(false);
        }
      }
    };

    await attemptEndMeeting();
  }, [isHost, user?.userId, meetingId, addToast, router]);

  // Merge Functions
  const mergeMyChunks = useCallback(async () => {
    if (!user?.userId || !meetingId) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, userId: user.userId }),
      });
      
      const result = await res.json();
      if (res.ok) {
        addToast("Chunks merged successfully", "success");
      } else {
        throw new Error(result.error || "Merge failed");
      }
    } catch (error) {
      console.error("Merge error:", error);
      addToast("Failed to merge chunks", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, meetingId, addToast]);

  const mergeSideBySide = useCallback(async () => {
    if (!selectedPartner) {
      addToast("Please select a partner for side-by-side merge", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/merge/side-by-side`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          userA: user?.userId,
          userB: selectedPartner,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast("Side-by-side merge successful", "success");
      } else {
        throw new Error(data.error || "Side-by-side merge failed");
      }
    } catch (error) {
      console.error("Side-by-side merge error:", error);
      addToast("Failed to merge side-by-side", "error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPartner, meetingId, user?.userId, addToast]);

  // Chat Functions
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket.current) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: user.userId,
      userName: user.fullname,
      message: newMessage.trim(),
      timestamp: Date.now(),
    };

    socket.current.emit("chat-message", { message });
    setChatMessages(prev => [...prev, message]);
    setNewMessage("");
  }, [newMessage, user, socket]);

  // Cleanup Function
  const cleanup = useCallback(() => {
    console.log("Cleaning up meeting resources...");
    
    // Clear all toast timeouts
    toastTimeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    toastTimeoutsRef.current.clear();
    setToasts([]);
    
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      streamRef.current = null;
    }

    // Stop screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Disconnect socket
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }

    // Clear intervals and timeouts
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping recorder:", error);
      }
    }

    // Reset refs
    otherSocketIdRef.current = null;
    chunkIndexRef.current = 0;

    // Reset states
    setShowMeetingUI(false);
    setHasJoined(false);
    setRemoteStream(null);
    setIsRecording(false);
    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
    setIsScreenSharing(false);
    setIsHandRaised(false);
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Auto-clear toasts on route change
  useEffect(() => {
    return () => {
      clearAllToasts();
    };
  }, [clearAllToasts]);
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  // Remote video effect
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Clear unread messages when chat is opened
  useEffect(() => {
    if (showChat) {
      setUnreadMessages(0);
    }
  }, [showChat]);

  // Controls visibility
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_DELAY);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'failed': return 'Connection Failed';
      default: return 'Disconnected';
    }
  };

  if (!meetingId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Meeting ID</h1>
          <p className="text-gray-400">Please check your meeting link and try again.</p>
        </div>
      </div>
    );
  }

  if (isLoading && !showMeetingUI) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading meeting...</p>
        </div>
      </div>
    );
  }

  // Meeting UI (Google Meet Style)
  if (showMeetingUI) {
    return (
      <div 
        className="fixed inset-0 bg-gray-900 text-white overflow-hidden"
        onMouseMove={showControls}
        onMouseLeave={() => setControlsVisible(false)}
      >
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {toasts.length > 2 && (
            <button
              onClick={clearAllToasts}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Clear All ({toasts.length})
            </button>
          )}
          
          {toasts.slice(0, 5).map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg flex items-start justify-between transition-all duration-300 ${
                toast.type === 'success' 
                  ? 'bg-green-600' 
                  : toast.type === 'error' 
                  ? 'bg-red-600' 
                  : toast.type === 'warning'
                  ? 'bg-yellow-600'
                  : 'bg-blue-600'
              } text-white`}
            >
              <div className="flex-1 pr-2">
                <span className="text-sm break-words">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
                aria-label="Close notification"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {toasts.length > 5 && (
            <div className="text-center text-sm text-gray-400">
              +{toasts.length - 5} more notifications
            </div>
          )}
        </div>

        {/* Main Video Area */}
        <div className="relative h-full">
          {/* Remote Video (Main) */}
          <div className="absolute inset-0 bg-black">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="w-16 h-16 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-2">Waiting for others to join...</p>
                  <p className={`text-sm ${getConnectionStatusColor()}`}>
                    {getConnectionStatusText()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">{user.fullname.charAt(0)}</span>
                </div>
              </div>
            )}
            
            {/* Local video controls */}
            <div className="absolute bottom-2 left-2 flex space-x-1">
              {isMuted && (
                <div className="p-1 bg-red-600 rounded-full">
                  <MicrophoneIconSolid className="w-3 h-3" />
                </div>
              )}
              {isVideoOff && (
                <div className="p-1 bg-red-600 rounded-full">
                  <VideoCameraSlashIcon className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>

          {/* Meeting Info */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5" />
                <span className="font-mono">{formatDuration(duration)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                <span className="text-sm">{getConnectionStatusText()}</span>
              </div>
            </div>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 rounded-full px-4 py-2 flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording</span>
            </div>
          )}

          {/* Screen Sharing Indicator */}
          {isScreenSharing && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-blue-600 rounded-full px-4 py-2 flex items-center space-x-2">
              <PresentationChartBarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Screen Sharing</span>
            </div>
          )}

          {/* Controls */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center justify-center space-x-4">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700 scale-110' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicrophoneIconSolid className="w-6 h-6" />
                ) : (
                  <MicrophoneIcon className="w-6 h-6" />
                )}
              </button>

              {/* Video Button */}
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isVideoOff 
                    ? 'bg-red-600 hover:bg-red-700 scale-110' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? (
                  <VideoCameraSlashIcon className="w-6 h-6" />
                ) : (
                  <VideoCameraIcon className="w-6 h-6" />
                )}
              </button>

              {/* Speaker Button */}
              <button
                onClick={toggleSpeaker}
                className={`p-4 rounded-full transition-all duration-200 ${
                  !isSpeakerOn 
                    ? 'bg-red-600 hover:bg-red-700 scale-110' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
              >
                {isSpeakerOn ? (
                  <SpeakerWaveIcon className="w-6 h-6" />
                ) : (
                  <SpeakerXMarkIcon className="w-6 h-6" />
                )}
              </button>

              {/* Recording Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 scale-110' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                <div className={`w-6 h-6 rounded-full ${
                  isRecording ? 'bg-white' : 'bg-red-500'
                }`} />
              </button>

              {/* Screen Share Button */}
              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isScreenSharing 
                    ? 'bg-blue-600 hover:bg-blue-700 scale-110' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
              >
                <PresentationChartBarIcon className="w-6 h-6" />
              </button>

              {/* Hand Raise Button */}
              <button
                onClick={toggleHandRaise}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isHandRaised 
                    ? 'bg-yellow-600 hover:bg-yellow-700 scale-110' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isHandRaised ? 'Lower hand' : 'Raise hand'}
              >
                <HandRaisedIcon className="w-6 h-6" />
              </button>

              {/* Participants Button */}
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-4 rounded-full transition-all duration-200 ${
                  showParticipants 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Show participants"
              >
                <UserGroupIcon className="w-6 h-6" />
              </button>

              {/* Chat Button */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-4 rounded-full transition-all duration-200 relative ${
                  showChat 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Show chat"
              >
                <ChatBubbleLeftIcon className="w-6 h-6" />
                {unreadMessages > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
                    {unreadMessages}
                  </div>
                )}
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-4 rounded-full transition-all duration-200 ${
                  showSettings 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Settings"
              >
                <Cog6ToothIcon className="w-6 h-6" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-200"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="w-6 h-6" />
                ) : (
                  <ArrowsPointingOutIcon className="w-6 h-6" />
                )}
              </button>

              {/* Leave/End Meeting Button */}
              <button
                onClick={isHost ? handleEndMeeting : handleLeaveMeeting}
                disabled={isLoading}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                title={isHost ? 'End meeting' : 'Leave meeting'}
              >
                {isLoading ? (
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <PhoneIcon className="w-6 h-6 transform rotate-[135deg]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="absolute top-0 right-0 w-80 h-full bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto z-40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Participants ({joinedUsers.length + 1})</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {/* Current user */}
              <div className="flex items-center space-x-3 p-2 bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {user.fullname.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.fullname}</p>
                  <p className="text-sm text-gray-400">You {isHost && '(Host)'}</p>
                </div>
                <div className="flex space-x-1">
                  {isMuted && <MicrophoneIconSolid className="w-4 h-4 text-red-500" />}
                  {isVideoOff && <VideoCameraSlashIcon className="w-4 h-4 text-red-500" />}
                  {isHandRaised && <HandRaisedIcon className="w-4 h-4 text-yellow-500" />}
                </div>
              </div>
              
              {/* Other participants */}
              {joinedUsers.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {participant.name?.charAt(0) || participant.email?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                  <p className="font-medium">
  {participant.name || participant.email?.split('@')[0] || 'Guest'}
</p>                    <p className="text-sm text-gray-400">
                      {participant.id === meetingDetails?.hostId ? 'Host' : 'Guest'}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    {participant.isMuted && <MicrophoneIconSolid className="w-4 h-4 text-red-500" />}
                    {participant.isVideoOff && <VideoCameraSlashIcon className="w-4 h-4 text-red-500" />}
                    {participant.isHandRaised && <HandRaisedIcon className="w-4 h-4 text-yellow-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="absolute bottom-0 right-0 w-80 h-96 bg-gray-800 border-l border-gray-700 flex flex-col z-40">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`p-2 rounded-lg ${
                  msg.userId === user.userId ? 'bg-blue-600 ml-4' : 'bg-gray-700 mr-4'
                }`}>
                  <p className="text-xs text-gray-300 mb-1">{msg.userName}</p>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute bottom-20 right-4 w-80 bg-gray-800 border border-gray-700 rounded-lg p-4 z-40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Recording</h4>
                <div className="space-y-2">
                  <button
                    onClick={mergeMyChunks}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Merge My Chunks'}
                  </button>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Side-by-Side Partner</label>
                    <select
                      value={selectedPartner || ''}
                      onChange={(e) => setSelectedPartner(e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select partner</option>
                      {joinedUsers.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name || partner.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={mergeSideBySide}
                    disabled={!selectedPartner || isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Merge Side-by-Side'}
                  </button>
                </div>
              </div>
              
              {/* Recording Status */}
              {chunkStatuses.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recording Status</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {chunkStatuses.slice(-5).map((status) => (
                      <div key={status.index} className="flex items-center space-x-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          status.status === 'success' ? 'bg-green-500' : 
                          status.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <span className="text-gray-300">{status.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pre-meeting UI
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Join Meeting</h1>
          <p className="text-gray-400">Meeting ID: {meetingId}</p>
          {meetingDetails?.title && (
            <p className="text-lg text-gray-300 mt-2">{meetingDetails.title}</p>
          )}
        </div>

        {/* User Info */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.fullname} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold">{user.fullname.charAt(0)}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.fullname}</h2>
                <p className="text-gray-400">{user.email}</p>
                {isHost && <p className="text-blue-400 text-sm">Host</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold">{user.fullname.charAt(0)}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Preview Controls */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isMuted ? <MicrophoneIconSolid className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isVideoOff ? <VideoCameraSlashIcon className="w-5 h-5" /> : <VideoCameraIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Participants */}
        {joinedUsers.length > 0 && (
          <div className="max-w-md mx-auto mb-8">
            <h3 className="text-lg font-semibold mb-4">Current Participants ({joinedUsers.length})</h3>
            <div className="space-y-2">
              {joinedUsers.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {participant.name?.charAt(0) || participant.email?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{participant.name || participant.email}</span>
                    {participant.id === meetingDetails?.hostId && (
                      <span className="text-blue-400 text-sm ml-2">(Host)</span>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    {participant.isMuted && <MicrophoneIconSolid className="w-4 h-4 text-red-500" />}
                    {participant.isVideoOff && <VideoCameraSlashIcon className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join Button */}
        <div className="text-center">
          <button
            onClick={handleJoinMeeting}
            disabled={!user?.userId || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Joining...</span>
              </div>
            ) : (
              'Join Meeting'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingPage;
