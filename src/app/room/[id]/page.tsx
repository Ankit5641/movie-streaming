"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, use } from "react";
import io, { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { useWebRTC } from "@/hooks/useWebRTC";

interface Message {
  id: number;
  user: string;
  message?: string;
  avatar?: string | null;
}

interface Reaction {
  id: number;
  emoji: string;
  user: string;
  left: number;
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestMobileMessage, setLatestMobileMessage] = useState<Message | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [chatInput, setChatInput] = useState("");
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  useEffect(() => { videoUrlRef.current = videoUrl; }, [videoUrl]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const { remoteStreams, isMuted, toggleMute, micError, speakingUsers, isScreenSharing, startScreenShare, stopScreenShare } = useWebRTC(roomId, socket);

  // New States
  const [isJoined, setIsJoined] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [bufferingUsers, setBufferingUsers] = useState<string[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  
  const [isLocked, setIsLocked] = useState(false);
  const [playlist, setPlaylist] = useState<{url: string, name: string}[]>([]);
  const [participants, setParticipants] = useState<{id: string, name: string}[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"chat" | "queue" | "participants">("chat");
  const [isHost, setIsHost] = useState(false);
  const isHostRef = useRef(false);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const ignorePlay = useRef(false);
  const ignorePause = useRef(false);
  const ignoreSeek = useRef(false);

  useEffect(() => {
    if (!session?.user) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const newSocket = socketUrl ? io(socketUrl, { path: "/socket.io/" }) : io({ path: "/socket.io/" });
    setSocket(newSocket);

    // Initial Join attempt (no password)
    newSocket.emit("join-room", { roomId, password: "", userName: session.user.name || session.user.email });

    newSocket.on("join-error", (err) => {
      setNeedsPassword(true);
      setJoinError(err);
    });

    newSocket.on("join-success", (data) => {
      setIsJoined(true);
      setNeedsPassword(false);
      if (data && data.participants) {
        setParticipants(data.participants);
      }
    });

    newSocket.on("video-buffering", ({ id, name }) => {
      setBufferingUsers(prev => prev.includes(name) ? prev : [...prev, name]);
      if (videoRef.current && !videoRef.current.paused) {
        ignorePause.current = true;
        videoRef.current.pause();
      }
    });

    newSocket.on("video-ready", ({ id }) => {
      setBufferingUsers([]);
      if (videoRef.current && videoRef.current.paused) {
        ignorePlay.current = true;
        videoRef.current.play().catch(() => {});
      }
    });

    newSocket.on("play", ({ time }) => {
      if (videoRef.current) {
        if (Math.abs(videoRef.current.currentTime - time) > 1) {
          ignoreSeek.current = true;
          videoRef.current.currentTime = time;
        }
        if (videoRef.current.paused) {
          ignorePlay.current = true;
          videoRef.current.play().catch(e => console.error("Play error", e));
        }
      }
    });

    newSocket.on("pause", ({ time }) => {
      if (videoRef.current) {
        if (Math.abs(videoRef.current.currentTime - time) > 1) {
          ignoreSeek.current = true;
          videoRef.current.currentTime = time;
        }
        if (!videoRef.current.paused) {
          ignorePause.current = true;
          videoRef.current.pause();
        }
      }
    });

    newSocket.on("seek", ({ time }) => {
      if (videoRef.current) {
        if (Math.abs(videoRef.current.currentTime - time) > 0.5) {
          ignoreSeek.current = true;
          videoRef.current.currentTime = time;
        }
      }
    });

    newSocket.on("sync-video", ({ url }) => {
      setVideoUrl(url);
    });

    newSocket.on("sync-playlist", ({ playlist }) => {
      setPlaylist(playlist);
    });

    newSocket.on("lock-room", ({ locked }) => {
      setIsLocked(locked);
    });

    newSocket.on("receive-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setLatestMobileMessage(msg);
      setTimeout(() => {
        setLatestMobileMessage((current) => current?.id === msg.id ? null : current);
      }, 4000);
    });

    newSocket.on("receive-reaction", ({ emoji, user, id }) => {
      setReactions((prev) => [...prev, { id, emoji, user, left: Math.random() * 80 + 10 }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    newSocket.on("user-connected", (payload) => {
      setParticipants(prev => {
        if (!prev.find(p => p.id === payload.id)) {
          return [...prev, { id: payload.id, name: payload.name || "Guest" }];
        }
        return prev;
      });
      if (videoUrlRef.current) {
        newSocket.emit("sync-video", { roomId, url: videoUrlRef.current });
        if (videoRef.current && !videoRef.current.paused) {
          newSocket.emit("play", { roomId, time: videoRef.current.currentTime });
        } else if (videoRef.current) {
          newSocket.emit("pause", { roomId, time: videoRef.current.currentTime });
        }
      }
    });

    newSocket.on("user-disconnected", (id) => {
      setParticipants(prev => prev.filter(p => p.id !== id));
    });

    newSocket.on("kicked", () => {
      alert("You have been removed by the host.");
      router.push("/");
    });
    
    return () => {
      newSocket.disconnect();
    };
  }, [roomId, session]);

  const handleJoinWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket) {
      socket.emit("join-room", { roomId, password: passwordInput, userName: session?.user?.name || session?.user?.email });
    }
  };

  const setRoomPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && newPasswordInput) {
      socket.emit("set-room-password", { roomId, password: newPasswordInput });
      setShowPasswordModal(false);
      setIsLocked(true);
      socket.emit("lock-room", { roomId, locked: true });
      alert("Room password set and locked.");
    }
  };

  const handlePlay = () => {
    if (ignorePlay.current) { ignorePlay.current = false; return; }
    if (socket && videoRef.current) {
      if (!isHost && isLocked) { ignorePause.current = true; videoRef.current.pause(); return; }
      socket.emit("play", { roomId, time: videoRef.current.currentTime });
    }
  };

  const handlePause = () => {
    if (ignorePause.current) { ignorePause.current = false; return; }
    if (socket && videoRef.current) {
      if (!isHost && isLocked) { ignorePlay.current = true; videoRef.current.play().catch(() => {}); return; }
      socket.emit("pause", { roomId, time: videoRef.current.currentTime });
    }
  };

  const handleSeek = () => {
    if (ignoreSeek.current) { ignoreSeek.current = false; return; }
    if (socket && videoRef.current) {
      if (!isHost && isLocked) return;
      socket.emit("seek", { roomId, time: videoRef.current.currentTime });
    }
  };

  const handleWaiting = () => {
    if (socket) socket.emit("video-buffering", { roomId, userName: session?.user?.name || session?.user?.email });
  };
  const handlePlaying = () => {
    if (socket) socket.emit("video-ready", { roomId });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !session?.user) return;
    socket.emit("send-message", { 
      roomId, 
      message: chatInput, 
      user: session.user.name || session.user.email,
      avatar: session.user.avatar
    });
    setChatInput("");
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const newPlaylistItems = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Step 1: Get presigned URL
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type || "video/mp4" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to get upload URL");

        const { presignedUrl, publicUrl } = data;

        // Step 2: Upload directly to R2 using XMLHttpRequest for progress
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl, true);
          xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const fileProgress = (event.loaded / event.total) * 100;
              const totalProgress = Math.round(((i * 100) + fileProgress) / files.length);
              setUploadProgress(totalProgress);
            }
          };

          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const dbRes = await fetch("/api/video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: file.name, url: publicUrl })
              });
              if (dbRes.ok) resolve(true);
              else reject(new Error("Failed to save to db"));
            } else {
              reject(new Error("Cloud upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        newPlaylistItems.push({ url: publicUrl, name: file.name });
      }

      setPlaylist(prev => {
        const updated = [...prev, ...newPlaylistItems];
        if (socket) socket.emit("sync-playlist", { roomId, playlist: updated });
        return updated;
      });

    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  if (status === "loading" || !session) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;

  if (needsPassword && !isJoined) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🔒</div>
          <h2 className="text-2xl font-bold text-center mb-2">Private Room</h2>
          <p className="text-gray-400 text-center mb-6">This room is locked. Please enter the PIN.</p>
          {joinError && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-4 text-center">{joinError}</div>}
          <form onSubmit={handleJoinWithPassword} className="space-y-4">
            <input type="password" placeholder="Room PIN" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 text-center text-xl tracking-widest" required />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 font-bold py-3 rounded-xl transition-colors">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  // Find if anyone is sharing a screen
  const screenShareStream = Object.values(remoteStreams).find(stream => stream.getVideoTracks().length > 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-50vh) scale(2); opacity: 0; }
        }
        .animate-float {
          animation: floatUp 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes floatMessage {
          0% { transform: translateY(20px); opacity: 0; }
          10% { transform: translateY(0); opacity: 1; }
          90% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        .animate-float-message {
          animation: floatMessage 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}} />
      <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-950 text-white overflow-hidden relative">
      {/* Video Section */}
      <div className="flex-1 flex flex-col relative min-h-[50dvh]">
        <header className="h-14 md:h-16 flex items-center px-4 md:px-6 bg-gray-900 border-b border-gray-800 shrink-0 z-10">
          <h1 className="text-lg md:text-xl font-bold truncate max-w-[150px] md:max-w-none">StreamGo: <span className="text-red-500">{roomId}</span></h1>
          <div className="ml-auto text-xs md:text-sm text-gray-400 flex items-center gap-2 md:gap-4">
            <button onClick={async () => {
              setShowInviteModal(true);
              const res = await fetch("/api/friends");
              if (res.ok) {
                const data = await res.json();
                setFriendsList(data.friends?.filter((f: any) => f.status === "ACCEPTED") || []);
              }
            }} className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded font-semibold text-white border border-gray-700 shadow flex items-center gap-2">
              <span className="hidden sm:inline">👥 Invite Friends</span>
              <span className="sm:hidden">👥</span>
            </button>
            {isScreenSharing ? (
              <button onClick={stopScreenShare} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 md:px-4 md:py-2 rounded font-semibold animate-pulse">Stop Sharing</button>
            ) : (
              <button onClick={startScreenShare} className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 md:px-4 md:py-2 rounded font-semibold hidden md:block shadow-[0_0_10px_rgba(79,70,229,0.5)]">Share Screen</button>
            )}
            <span className="hidden md:inline">Invite: {typeof window !== 'undefined' ? window.location.href : ''}</span>
            <label className={`bg-gray-800 hover:bg-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded cursor-pointer transition-colors font-semibold ${uploading ? "opacity-75 cursor-not-allowed" : ""}`}>
              {uploading ? `${uploadProgress}%` : "Add Videos"}
              <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} disabled={uploading} />
            </label>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-0 md:p-4 bg-black relative min-h-0 overflow-hidden">
          {/* Floating Reactions Overlay */}
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-0 text-4xl animate-float drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] flex flex-col items-center"
                style={{ left: `${r.left}%` }}
              >
                <span>{r.emoji}</span>
                <span className="text-[10px] font-bold text-white drop-shadow-md mt-1">{r.user.substring(0,10)}</span>
              </div>
            ))}
          </div>
          {/* Buffering Overlay */}
          {bufferingUsers.length > 0 && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-bold">Waiting for {bufferingUsers.join(", ")} to buffer...</p>
            </div>
          )}

          {screenShareStream ? (
            <div className="w-full h-full relative group">
              <video
                autoPlay
                playsInline
                muted // Muted to avoid double audio with the hidden elements
                className="w-full h-full object-contain"
                ref={(el) => { if (el && el.srcObject !== screenShareStream) el.srcObject = screenShareStream; }}
              />
              <div className="absolute top-4 left-4 bg-red-600 text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse">LIVE SCREEN</div>
            </div>
          ) : videoUrl ? (
            <div className="relative group flex items-center justify-center w-full h-full">
              <video
                ref={videoRef}
                src={videoUrl}
                className="max-w-full max-h-full rounded-xl shadow-2xl bg-black"
                controls
                onPlay={handlePlay}
                onPause={handlePause}
                onSeeked={handleSeek}
                onWaiting={handleWaiting}
                onPlaying={handlePlaying}
                onCanPlayThrough={handlePlaying}
              />
              {/* Skip Controls overlay */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }} className="bg-black/60 hover:bg-black/80 px-4 py-2 rounded-full font-medium backdrop-blur">⏪ -10s</button>
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10); }} className="bg-black/60 hover:bg-black/80 px-4 py-2 rounded-full font-medium backdrop-blur">+10s ⏩</button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-300">No Media Playing</h2>
              <p className="mt-2">Upload a video or Share your Screen to start StreamGo!</p>
            </div>
          )}

          {/* Custom overlay when not host */}
          {!isHost && videoUrl && !isScreenSharing && (
            <div className="absolute inset-0 z-10 opacity-0" onClick={(e) => e.preventDefault()} onDoubleClick={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()} />
          )}

          {/* Floating Mobile Chat Toast */}
          <div className="md:hidden absolute bottom-16 left-4 right-4 z-20 pointer-events-none flex flex-col items-center">
            {latestMobileMessage && (
              <div key={latestMobileMessage.id} className="animate-float-message bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl inline-block max-w-full shadow-lg border border-white/10">
                <span className="font-bold text-red-400 mr-2">{latestMobileMessage.user}:</span>
                <span className="text-sm truncate block sm:inline">{latestMobileMessage.message}</span>
              </div>
            )}
          </div>
        </main>
        
        {/* Admin Controls & Mobile Tabs */}
        <div className="h-14 md:h-16 bg-gray-900 border-t border-gray-800 flex flex-wrap md:flex-nowrap items-center justify-between px-2 md:px-6 shrink-0 z-10 gap-2">
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar flex-shrink-0">
            {!isHost ? (
              <button onClick={() => setIsHost(true)} className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded text-xs md:text-sm font-medium whitespace-nowrap">Claim Host</button>
            ) : (
              <div className="flex items-center gap-2 md:gap-4 whitespace-nowrap">
                <span className="text-red-500 font-bold text-xs md:text-sm">👑 Host</span>
                <label className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={isLocked} onChange={(e) => { setIsLocked(e.target.checked); if (socket) socket.emit("lock-room", { roomId, locked: e.target.checked }); }} className="rounded bg-gray-800 text-red-600 focus:ring-red-500"/>
                  <span className="hidden sm:inline">Lock Room</span>
                  <span className="sm:hidden">Lock</span>
                </label>
                <button onClick={() => setShowPasswordModal(true)} className="text-[10px] md:text-xs bg-gray-800 hover:bg-gray-700 px-2 md:px-3 py-1 md:py-1.5 rounded border border-gray-700">Set PIN</button>
              </div>
            )}
          </div>

          {/* Mobile Tabs */}
          <div className="flex md:hidden bg-gray-800 rounded-lg p-1 max-w-[220px] w-full ml-auto">
            <button 
              onClick={() => setActiveSidebarTab("chat")} 
              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${activeSidebarTab === "chat" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
              Chat
            </button>
            <button 
              onClick={() => setActiveSidebarTab("queue")} 
              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors flex items-center justify-center gap-1 ${activeSidebarTab === "queue" ? "bg-red-600 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
              Queue {playlist.length > 0 && <span className="bg-red-500/20 text-red-300 px-1 py-0.5 rounded-full text-[8px]">{playlist.length}</span>}
            </button>
            <button 
              onClick={() => setActiveSidebarTab("participants")} 
              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors flex items-center justify-center gap-1 ${activeSidebarTab === "participants" ? "bg-green-600 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
              People {participants.length > 0 && <span className="bg-green-500/20 text-green-300 px-1 py-0.5 rounded-full text-[8px]">{participants.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="w-full md:w-72 h-[35dvh] md:h-full bg-gray-900 border-t border-gray-800 md:border-t-0 md:border-l flex flex-col shrink-0 relative">
        {/* Desktop Tabs (Hidden on mobile) */}
        <div className="hidden md:flex h-14 md:h-16 border-b border-gray-800 items-center justify-between px-2 shrink-0 bg-gray-900/95 backdrop-blur z-10">
          <div className="flex bg-gray-800 rounded-lg p-1 w-full relative">
            <button 
              onClick={() => setActiveSidebarTab("chat")} 
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${activeSidebarTab === "chat" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
              Live Chat
            </button>
            <button 
              onClick={() => setActiveSidebarTab("queue")} 
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors flex items-center justify-center gap-2 ${activeSidebarTab === "queue" ? "bg-red-600 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
              Queue {playlist.length > 0 && <span className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full text-[10px]">{playlist.length}</span>}
            </button>
            <button 
              onClick={() => setActiveSidebarTab("participants")} 
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors flex items-center justify-center gap-2 ${activeSidebarTab === "participants" ? "bg-green-600 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
              Voice {participants.length > 0 && <span className="bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full text-[10px]">{participants.length}</span>}
            </button>
            {/* Active Speakers Indicator absolute positioned */}
            {speakingUsers.length > 0 && (
              <div className="absolute right-0 -top-2 w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] flex items-center justify-center text-[8px] font-bold z-10 animate-pulse text-white">
                🔊
              </div>
            )}
          </div>
        </div>
        
        {activeSidebarTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.user === (session.user?.name || session.user?.email);
                return (
                  <div key={i} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="w-8 h-8 rounded-full bg-gray-800 shrink-0 overflow-hidden border border-gray-700 flex items-center justify-center text-xs font-bold">
                      {msg.avatar ? (
                        <img src={msg.avatar} alt={msg.user} className="w-full h-full object-cover" />
                      ) : (
                        msg.user[0].toUpperCase()
                      )}
                    </div>
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                      <span className="text-[10px] text-gray-500 mb-1">{msg.user}</span>
                      <div className={`p-3 rounded-xl ${isMe ? "bg-red-600 text-white rounded-tr-none" : "bg-gray-800 text-gray-200 rounded-tl-none"}`}>
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-gray-900 border-t border-gray-800 shrink-0">
              <div className="flex justify-between mb-3 px-1">
                {["😂", "😮", "😢", "❤️", "🔥", "👏"].map((emoji) => (
                  <button key={emoji} onClick={() => { 
                    if (!socket || !session?.user) return; 
                    const user = session.user.name || session.user.email;
                    socket.emit("send-reaction", { roomId, emoji, user }); 
                    socket.emit("send-message", { roomId, message: emoji, user, avatar: session.user.avatar });
                  }} className="text-xl hover:scale-125 transition-transform">
                    {emoji}
                  </button>
                ))}
              </div>
              <form onSubmit={sendMessage} className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
                <button type="button" onClick={toggleMute} className={`p-2 rounded-lg transition-colors ${!isMuted ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" : "bg-gray-800 hover:bg-gray-700"}`}>
                  {isMuted ? "🔇" : "🎤"}
                </button>
              </form>
              {micError && <div className="text-xs text-red-500 text-center mt-2">{micError}</div>}
            </div>
          </div>
        )}

        {activeSidebarTab === "queue" && (
          <div className="flex-1 overflow-y-auto bg-gray-950 p-2">
            {playlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                <span className="text-4xl mb-2 opacity-50">📂</span>
                <p className="text-sm">The Queue is empty.</p>
                {isHost && <p className="text-xs mt-2 text-gray-600">Click "Add Videos" to add files.</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.map((item, idx) => {
                  const isPlaying = item.url === videoUrl;
                  return (
                    <div key={idx} className={`group/item flex flex-col p-3 rounded-xl transition-all border ${isPlaying ? 'bg-red-600/10 border-red-500/50' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${isPlaying ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-gray-800 text-gray-500 font-bold text-xs'}`}>
                          {isPlaying ? <span className="animate-pulse">▶</span> : idx + 1}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-sm truncate font-medium ${isPlaying ? 'text-red-400' : 'text-gray-300'}`} title={item.name}>
                            {item.name.replace(/\.[^/.]+$/, "")}
                          </p>
                        </div>
                      </div>
                      
                      {isHost && (
                        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-800/50 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          {!isPlaying && (
                            <button onClick={() => { 
                              setVideoUrl(item.url);
                              if(socket) socket.emit("sync-video", { roomId, url: item.url }); 
                            }} className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1 transition-colors">
                              ▶️ Stream
                            </button>
                          )}
                          <button onClick={() => {
                            const newPlaylist = playlist.filter((_, i) => i !== idx);
                            setPlaylist(newPlaylist);
                            if (socket) socket.emit("sync-playlist", { roomId, playlist: newPlaylist });
                          }} className="bg-gray-800 hover:bg-red-600/20 text-gray-400 hover:text-red-400 text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1 transition-colors">
                            ✖ Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSidebarTab === "participants" && (
          <div className="flex-1 overflow-y-auto bg-gray-950 p-2">
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-3 flex items-center gap-2 pl-1 pt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Voice Participants
            </h3>
            {participants.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-10">No one is in the room.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {participants.map((p) => {
                  const isMe = socket ? p.id === socket.id : false;
                  return (
                    <div key={p.id} className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-800">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${speakingUsers.includes(p.id) ? "bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "bg-gray-800 text-gray-400"}`}>
                        {p.name.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs text-gray-300 font-semibold mb-1 truncate">
                          {p.name} {isMe && <span className="text-gray-500">(You)</span>}
                        </div>
                        {!isMe && (
                          <input 
                            type="range" min="0" max="1" step="0.05" defaultValue="1" 
                            onChange={(e) => {
                              const audioEl = document.getElementById(`audio-${p.id}`) as HTMLAudioElement;
                              if (audioEl) audioEl.volume = parseFloat(e.target.value);
                            }}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500" 
                          />
                        )}
                      </div>
                      {isHost && !isMe && (
                        <button 
                          onClick={() => socket?.emit("kick-user", { roomId, targetId: p.id })}
                          title="Kick User"
                          className="ml-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-colors uppercase tracking-wide border border-red-500/30"
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
      </div>

      {/* Hidden Audio Elements (Must always be rendered to maintain WebRTC connections) */}
      {participants.map((p) => {
        const isMe = socket ? p.id === socket.id : false;
        const stream = remoteStreams[p.id];
        if (isMe || !stream) return null;
        return <audio key={`audio-hidden-${p.id}`} id={`audio-${p.id}`} autoPlay playsInline className="hidden" ref={(el) => { if (el && el.srcObject !== stream) el.srcObject = stream; }} />;
      })}

      {/* Set Password Modal */}
      {showPasswordModal && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4 text-center">Set Room Password</h3>
            <form onSubmit={setRoomPassword} className="space-y-4">
              <input type="text" placeholder="Enter PIN (e.g. 1234)" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:border-red-500 text-center" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded">Cancel</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 font-bold py-2 rounded">Lock Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {/* Invite Friends Modal */}
      {showInviteModal && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Invite Friends</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            {friendsList.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">You have no friends on your list yet. Add them in the <a href="/friends" target="_blank" className="text-red-500 hover:underline">Friends tab</a>!</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {friendsList.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700 p-2 rounded-lg">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden text-[10px] font-bold flex items-center justify-center shrink-0">
                        {f.friend.avatar ? <img src={f.friend.avatar} alt="Avatar" /> : f.friend.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold truncate text-gray-200">{f.friend.name || f.friend.email.split("@")[0]}</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (socket && session?.user) {
                          socket.emit("send-invite", { targetUserId: f.friend.id, roomId, fromUser: session.user.name || session.user.email });
                          alert(`Invite sent to ${f.friend.email.split("@")[0]}!`);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-xs font-bold px-3 py-1.5 rounded transition-colors"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
