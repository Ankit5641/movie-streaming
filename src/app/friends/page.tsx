"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FriendsPage() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<any[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const fetchFriends = async () => {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends || []);
    }
  };

  useEffect(() => {
    if (session) fetchFriends();
  }, [session]);

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", email: emailInput })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Friend request sent!");
      setEmailInput("");
      fetchFriends();
    } else {
      setMessage(data.error || "Failed to send request");
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", friendshipId })
    });
    if (res.ok) {
      fetchFriends();
    }
  };

  if (!session) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  const pendingIncoming = friends.filter(f => f.status === "PENDING" && f.isIncoming);
  const pendingOutgoing = friends.filter(f => f.status === "PENDING" && !f.isIncoming);
  const acceptedFriends = friends.filter(f => f.status === "ACCEPTED");

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-8 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">Your Friends</h1>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mb-8 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Add a Friend</h2>
          <form onSubmit={sendRequest} className="flex gap-4">
            <input 
              type="email" 
              value={emailInput} 
              onChange={(e) => setEmailInput(e.target.value)} 
              placeholder="Friend's email address..." 
              className="flex-1 bg-black/40 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500" 
              required 
            />
            <button type="submit" className="bg-red-600 hover:bg-red-700 font-bold px-8 py-3 rounded-xl transition-colors">Send Request</button>
          </form>
          {message && <p className="mt-4 text-sm text-gray-400">{message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-300">My Friends</h2>
            {acceptedFriends.length === 0 ? (
              <p className="text-gray-500 italic">No friends yet. Add some above!</p>
            ) : (
              <div className="space-y-4">
                {acceptedFriends.map((f) => (
                  <div key={f.id} className="flex items-center justify-between bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center font-bold">
                        {f.friend.avatar ? <img src={f.friend.avatar} alt="Avatar" /> : f.friend.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{f.friend.name || f.friend.email.split("@")[0]}</div>
                        <div className="text-xs text-gray-500">{f.friend.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-300">Requests</h2>
            
            {pendingIncoming.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Incoming</h3>
                <div className="space-y-3">
                  {pendingIncoming.map((f) => (
                    <div key={f.id} className="flex items-center justify-between bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                      <div className="text-sm">
                        <span className="font-bold">{f.friend.email}</span> wants to be friends
                      </div>
                      <button onClick={() => acceptRequest(f.id)} className="bg-red-600 hover:bg-red-700 text-xs font-bold px-3 py-1.5 rounded">Accept</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingOutgoing.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Sent</h3>
                <div className="space-y-3">
                  {pendingOutgoing.map((f) => (
                    <div key={f.id} className="flex items-center justify-between bg-gray-900/30 border border-gray-800 p-3 rounded-lg opacity-75">
                      <div className="text-sm text-gray-400">Waiting for <span className="font-bold">{f.friend.email}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && (
              <p className="text-gray-500 italic">No pending requests.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
