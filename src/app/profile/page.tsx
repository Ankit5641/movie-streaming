"use client";

import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>Loading or not logged in...</p>
      </div>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // 1. Get Presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get upload URL");

      const { presignedUrl, publicUrl } = data;

      // 2. Upload to Cloudflare R2
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image to cloud storage");

      // 3. Save to Profile
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl })
      });

      if (!profileRes.ok) throw new Error("Failed to save avatar to profile");

      // Force session refresh to load new avatar
      await update();
      setUploading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"></div>
        
        <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-8 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Your Profile</h1>

        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer mb-4" onClick={() => !uploading && fileInputRef.current?.click()}>
            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-gray-800 shadow-xl transition-transform ${uploading ? 'animate-pulse opacity-50' : 'group-hover:scale-105 group-hover:border-red-500'}`}>
              {session.user?.avatar ? (
                <img src={session.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-4xl font-bold text-gray-600">
                  {session.user?.email?.[0].toUpperCase()}
                </div>
              )}
            </div>
            
            {!uploading && (
              <div className="absolute bottom-0 right-0 bg-red-600 rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>
          
          <h2 className="text-xl font-bold">{session.user?.name || "User"}</h2>
          <p className="text-gray-400">{session.user?.email}</p>
        </div>

        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">{error}</div>}
        
        <div className="space-y-4">
          <div className="p-4 bg-black/30 border border-gray-800 rounded-xl">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Account ID</span>
            <code className="text-gray-300 text-sm font-mono break-all">{session.user?.id}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
