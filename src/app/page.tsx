"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [publicRooms, setPublicRooms] = useState<any[]>([]);

  useEffect(() => {
    if (session) {
      fetch("/api/active-rooms")
        .then(res => res.json())
        .then(data => setPublicRooms(data.rooms || []))
        .catch(console.error);
    }
  }, [session]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-500">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white relative overflow-hidden perspective-1000">
        {/* Animated Abstract 3D Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Floating 3D Hero Card */}
        <div className="z-10 text-center max-w-3xl px-4 transform-gpu transition-transform duration-700 hover:scale-105 hover:rotate-1">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-12 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.2)] hover:shadow-[0_0_80px_rgba(220,38,38,0.4)] transition-shadow duration-500 relative">
            {/* 3D Inner Glow */}
            <div className="absolute inset-0 rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

            <h1 className="text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-red-100 to-red-600 drop-shadow-2xl">
              Welcome to <span className="text-red-500">StreamGo</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed font-light">
              Experience movies and shows together with friends in real-time. Sync playback, voice chat instantly, and never watch alone again.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                href="/login" 
                className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-xl overflow-hidden transition-all transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(220,38,38,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative z-10">Start Watching</span>
              </Link>
              <Link 
                href="/register" 
                className="px-8 py-4 bg-gray-900/50 hover:bg-gray-800 text-white font-bold rounded-xl border border-gray-700 transition-all transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-red-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <nav className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-800 drop-shadow-md">StreamGo</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/friends" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors hidden sm:block">
                Friends
              </Link>
              <div className="hidden sm:flex items-center gap-3 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-800 shadow-inner">
                <Link href="/profile" className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden border border-gray-700 hover:border-red-500 transition-colors">
                  {session.user?.avatar ? (
                    <img src={session.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    session.user?.email?.[0].toUpperCase()
                  )}
                </Link>
                <Link href="/profile" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{session.user?.name || session.user?.email}</Link>
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm font-semibold text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800 hover:shadow-md"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Your Spaces</h2>
            
            {/* 3D Room Creation Card */}
            <div className="group bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-10 text-center text-gray-400 transform-gpu transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(220,38,38,0.15)] relative overflow-hidden">
              <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform group-hover:rotate-6 transition-transform duration-500 border border-gray-700">
                <svg className="w-10 h-10 text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Host a new StreamGo</h3>
              <p className="mb-8 text-lg font-light">Create a private 3D theater to invite friends instantly.</p>
              
              <button 
                onClick={() => router.push(`/room/${Math.random().toString(36).substring(2, 10)}`)}
                className="relative inline-flex px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-[0_10px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_15px_30px_rgba(220,38,38,0.5)] transform hover:-translate-y-1"
              >
                Create a Room
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Join a Room</h2>
            
            {/* 3D Join Card */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl transform-gpu transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6 shadow-lg border border-gray-700">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              
              <p className="text-gray-300 text-base mb-6 font-medium">Have an invite link or room ID?</p>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const roomId = formData.get("roomId");
                  if (roomId) router.push(`/room/${roomId}`);
                }}
                className="flex flex-col gap-4"
              >
                <input 
                  type="text" 
                  name="roomId"
                  placeholder="Paste room ID here..." 
                  className="w-full bg-black/40 border border-gray-700/50 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base transition-all shadow-inner"
                  required
                />
                <button type="submit" className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl">
                  Join Room
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Public Rooms Directory */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Public Rooms Directory</h2>
            <button onClick={() => {
              fetch("/api/active-rooms").then(res => res.json()).then(data => setPublicRooms(data.rooms || []));
            }} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
          </div>
          
          {publicRooms.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">🍿</div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">No public rooms active</h3>
              <p className="text-gray-500">Be the first to host a watch party and invite your friends!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicRooms.map((room) => (
                <Link key={room.id} href={`/room/${room.id}`} className="group relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-red-500/50 transition-colors">
                  <div className="h-32 bg-black flex items-center justify-center border-b border-gray-800 group-hover:bg-gray-950 transition-colors">
                    {room.hasVideo ? (
                      <div className="text-red-500 text-5xl drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">🎬</div>
                    ) : (
                      <div className="text-gray-600 text-5xl">☕</div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-1 truncate">Room: {room.id}</h3>
                    <div className="flex items-center text-sm text-gray-400 gap-4">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {room.users} Viewer{room.users !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        {room.hasVideo ? 'Now Playing' : 'Chilling'}
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-6 transition-opacity">
                    <span className="bg-red-600 text-white font-bold px-6 py-2 rounded-full shadow-lg">Join Room</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
