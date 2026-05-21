import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

export function useWebRTC(roomId: string, socket: Socket | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  
  // New State for Advanced Features
  const [speakingUsers, setSpeakingUsers] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const analyzeVolume = (stream: MediaStream, socketId: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      
      // We only want the audio tracks
      if (stream.getAudioTracks().length === 0) return;
      
      const source = audioContext.createMediaStreamSource(new MediaStream([stream.getAudioTracks()[0]]));
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let speakingThreshold = 15;
      let holdFrames = 0; // Keep speaking true for a few frames to prevent flickering

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        setSpeakingUsers(prev => {
          let isSpeaking = average > speakingThreshold;
          
          if (isSpeaking) {
            holdFrames = 30; // Hold for 30 frames (~0.5s)
          } else if (holdFrames > 0) {
            holdFrames--;
            isSpeaking = true;
          }

          if (isSpeaking && !prev.includes(socketId)) return [...prev, socketId];
          if (!isSpeaking && prev.includes(socketId)) return prev.filter(id => id !== socketId);
          return prev;
        });
        requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.error("Audio Context failed", e);
    }
  };

  const createPeer = useCallback((targetSocketId: string) => {
    const peer = new RTCPeerConnection(iceServers);
    
    // Add our local tracks to the connection (Mic + Screen if active)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, streamRef.current!);
      });
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, screenStreamRef.current!);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc-ice-candidate", {
          target: targetSocketId,
          candidate: event.candidate,
          sender: socket.id,
        });
      }
    };

    peer.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: remoteStream,
      }));
      
      // Attach volume analyzer
      analyzeVolume(remoteStream, targetSocketId);
    };

    peers.current[targetSocketId] = peer;
    return peer;
  }, [socket]);

  // Request Microphone Access
  useEffect(() => {
    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getAudioTracks().forEach(track => { track.enabled = false; }); // Muted by default
        streamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error("Microphone access denied or not found:", err);
        setMicError("Microphone access denied or not available.");
      }
    };
    initMic();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // WebRTC Signaling Logic
  useEffect(() => {
    if (!socket) return;

    const handleUserConnected = async (payload: any) => {
      const newSocketId = payload.id || payload; // Support both object and string payloads
      const peer = createPeer(newSocketId);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      
      socket.emit("webrtc-offer", {
        target: newSocketId,
        caller: socket.id,
        sdp: peer.localDescription,
      });
    };

    const handleReceiveOffer = async ({ caller, sdp }: { caller: string, sdp: RTCSessionDescriptionInit }) => {
      const peer = createPeer(caller);
      await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("webrtc-answer", {
        target: caller,
        caller: socket.id,
        sdp: peer.localDescription,
      });
    };

    const handleReceiveAnswer = async ({ caller, sdp }: { caller: string, sdp: RTCSessionDescriptionInit }) => {
      const peer = peers.current[caller];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const handleNewICECandidate = async ({ sender, candidate }: { sender: string, candidate: RTCIceCandidateInit }) => {
      const peer = peers.current[sender];
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleUserDisconnected = (disconnectedSocketId: string) => {
      if (peers.current[disconnectedSocketId]) {
        peers.current[disconnectedSocketId].close();
        delete peers.current[disconnectedSocketId];
      }
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[disconnectedSocketId];
        return newStreams;
      });
      setSpeakingUsers((prev) => prev.filter(id => id !== disconnectedSocketId));
    };

    socket.on("user-connected", handleUserConnected);
    socket.on("webrtc-offer", handleReceiveOffer);
    socket.on("webrtc-answer", handleReceiveAnswer);
    socket.on("webrtc-ice-candidate", handleNewICECandidate);
    socket.on("user-disconnected", handleUserDisconnected);

    return () => {
      socket.off("user-connected", handleUserConnected);
      socket.off("webrtc-offer", handleReceiveOffer);
      socket.off("webrtc-answer", handleReceiveAnswer);
      socket.off("webrtc-ice-candidate", handleNewICECandidate);
      socket.off("user-disconnected", handleUserDisconnected);
    };
  }, [socket, createPeer]);

  const toggleMute = () => {
    if (localStream) {
      const newMutedState = !isMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
      setIsMuted(newMutedState);
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = screenStream;
      
      // Replace tracks in existing peers
      Object.values(peers.current).forEach(peer => {
        screenStream.getTracks().forEach(track => {
          peer.addTrack(track, screenStream);
        });
      });

      // Handle user stopping screen share via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
      if (socket) socket.emit("start-screen-share", { roomId });
      
    } catch (err) {
      console.error("Error starting screen share", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      
      // Remove tracks from peers
      Object.values(peers.current).forEach(peer => {
        const senders = peer.getSenders();
        senders.forEach(sender => {
          if (sender.track && sender.track.kind === "video") {
            peer.removeTrack(sender);
          }
        });
      });
      
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      if (socket) socket.emit("stop-screen-share", { roomId });
    }
  };

  useEffect(() => {
    return () => {
      Object.values(peers.current).forEach(peer => peer.close());
      peers.current = {};
    };
  }, []);

  return { 
    localStream, 
    remoteStreams, 
    isMuted, 
    toggleMute, 
    micError,
    speakingUsers,
    isScreenSharing,
    startScreenShare,
    stopScreenShare
  };
}
