"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";

export function GlobalListeners() {
  const { data: session } = useSession();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [invite, setInvite] = useState<{ roomId: string, fromUser: string } | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    const newSocket = socketUrl ? io(socketUrl) : io();
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("register-user", { userId: session.user.id });
    });

    newSocket.on("receive-invite", (data) => {
      setInvite(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [session]);

  if (!invite) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl p-4 w-80 animate-bounce">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-xl flex-shrink-0">🎟️</div>
        <div>
          <h3 className="font-bold text-white mb-1">Room Invite!</h3>
          <p className="text-sm text-gray-300 mb-3"><span className="font-semibold text-white">{invite.fromUser}</span> invited you to join their room.</p>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                router.push(`/room/${invite.roomId}`);
                setInvite(null);
              }} 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded text-sm transition-colors"
            >
              Join Now
            </button>
            <button 
              onClick={() => setInvite(null)} 
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-1.5 rounded text-sm transition-colors"
            >
              Ignore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
