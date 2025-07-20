import { useEffect, useRef, useCallback } from 'react';
import io, { Socket } from "socket.io-client";
import { useRouter } from 'next/navigation';

// Define the types you are using (you can move these to a shared types file)
interface User {
  userId: string;
  fullname: string;
  email: string;
  profilePic: string;
}

interface Participant {
  id: number;
  socketId?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean;
  name?: string;
}

interface MeetingDetails {
  id: string;
  hostId: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

// Props that the hook will accept
interface SocketManagerProps {
  meetingDetails: MeetingDetails | null;
  user: User | null;
  isHost: boolean;
  showChat: boolean;
  peerConnectionRef: React.MutableRefObject<RTCPeerConnection | null>;
  hasSignaledReadiness: React.MutableRefObject<boolean>;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  setJoinedUsers: React.Dispatch<React.SetStateAction<Participant[]>>;
  setConnectionStatus: React.Dispatch<React.SetStateAction<string>>;
  setDuration: React.Dispatch<React.SetStateAction<number>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
  createPeerConnection: (targetSocketId: string) => void;
  initiateCall: (targetSocketId?: string) => void;
  cleanup: () => void;
}

export const useSocketManager = ({
  meetingDetails,
  user,
  isHost,
  showChat,
  peerConnectionRef,
  hasSignaledReadiness,
  addToast,
  setJoinedUsers,
  setConnectionStatus,
  setDuration,
  setChatMessages,
  setUnreadMessages,
  createPeerConnection,
  initiateCall,
  cleanup,
}: SocketManagerProps) => {
  const socket = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!meetingDetails || !user?.userId) {
      return;
    }

    console.log("Setting up socket connection...");
    
    socket.current = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    const currentSocket = socket.current;

    // --- Event Listeners ---
    currentSocket.on("connect", () => {
      console.log("Socket connected successfully");
      setConnectionStatus('connecting');
      addToast("Connected to meeting server", "success");
    });

    currentSocket.on("disconnect", (reason: Socket.DisconnectReason) => {
      console.log("Socket disconnected:", reason);
      hasSignaledReadiness.current = false;
      setConnectionStatus('disconnected');
      addToast("Disconnected from meeting server", "warning");
    });

    currentSocket.on("participants-updated", (updatedUsers: Participant[]) => {
      console.log("Participants updated:", updatedUsers);
      setJoinedUsers(prevUsers => {
        const userMap = new Map(prevUsers.map(u => [u.id, u]));
        return updatedUsers.map(newUser => {
          const existingUser = userMap.get(newUser.id);
          return existingUser ? { ...existingUser, ...newUser } : newUser;
        });
      });
    
      const otherUser = updatedUsers.find(u => u.id !== Number(user?.userId));
      if (otherUser && otherUser.socketId && !isHost && !hasSignaledReadiness.current) {
        hasSignaledReadiness.current = true;
        console.log("I am the guest, signaling readiness.");
        currentSocket.emit("client-ready", {
          meetingNoId: meetingDetails.id,
          fromSocketId: currentSocket.id
        });
      }
    });


    currentSocket.on("offer", async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
      // ... (rest of your socket event listeners)
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
    socket.current.on("ice-candidate", async ({ candidate }: any) => {
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

    if (isHost) {
      currentSocket.on("client-ready", ({ fromSocketId }: { fromSocketId: string }) => {
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
    
    // ... (Add all your other listeners: "answer", "ice-candidate", "meeting-ended", etc.)
    currentSocket.emit("join-meeting", {
      meetingNoId: meetingDetails.id,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.fullname,
        profilePic: user.profilePic,
      },
    });

    return () => {
      console.log("Cleaning up socket connection...");
      currentSocket.disconnect();
    };
  }, [meetingDetails, user, isHost]); // Dependencies for setting up the connection

  return socket; // Return the socket ref to the component
};