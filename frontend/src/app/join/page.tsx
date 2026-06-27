"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Video, AlertCircle, Loader2 } from "lucide-react";

export default function JoinMeeting() {
  const router = useRouter();
  const [meetingInput, setMeetingInput] = useState("");
  const [displayName, setDisplayName] = useState("Achal Raj");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to extract the 9-digit meeting ID (e.g., 123-456-789) from input url or raw text
  const getCleanMeetingId = (input: string): string => {
    let clean = input.trim();
    
    // If it's a URL or relative path (contains slashes), get the last segment
    if (clean.includes("/")) {
      const parts = clean.split("/");
      clean = parts[parts.length - 1];
    }
    
    // Remove query parameters if any (e.g., ?pwd=...)
    if (clean.includes("?")) {
      clean = clean.split("?")[0];
    }
    
    return clean;
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const meetingId = getCleanMeetingId(meetingInput);
    if (!meetingId) {
      setError("Please enter a valid Meeting ID or link.");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/meetings/${meetingId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
        }),
      });

      if (res.ok) {
        // Redirect to the meeting room page
        router.push(`/meeting/${meetingId}`);
      } else {
        if (res.status === 404) {
          setError("Meeting not found. Please check the ID or link and try again.");
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.detail || "Failed to join meeting.");
        }
      }
    } catch (err) {
      console.error("Error joining meeting:", err);
      setError("Could not connect to the server. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-800 flex flex-col font-sans">
      
      {/* Back Button Header */}
      <header className="h-16 px-6 flex items-center border-b border-gray-200/50 bg-white">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-zoom-blue transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </button>
      </header>

      {/* Center Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 shadow-xl rounded-3xl p-8 max-w-md w-full">
          
          {/* Header Title */}
          <div className="flex flex-col items-center text-center gap-2 mb-8">
            <div className="bg-zoom-blue/10 text-zoom-blue p-3.5 rounded-2xl">
              <Video className="w-7 h-7 fill-zoom-blue stroke-none" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">Join a Meeting</h1>
            <p className="text-sm text-gray-500">Enter the meeting details to connect with others</p>
          </div>

          {/* Form */}
          <form onSubmit={handleJoin} className="flex flex-col gap-5">
            
            {/* Meeting ID or Link Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="meeting-id" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Meeting ID or Personal Link
              </label>
              <input
                id="meeting-id"
                type="text"
                required
                placeholder="Example: 123-456-789 or link"
                value={meetingInput}
                onChange={(e) => setMeetingInput(e.target.value)}
                className="border border-gray-200 focus:border-zoom-blue focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 outline-none text-sm transition-all bg-gray-50/30 font-medium placeholder-gray-400"
              />
            </div>

            {/* Display Name Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="display-name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Your Name
              </label>
              <div className="relative">
                <input
                  id="display-name"
                  type="text"
                  required
                  placeholder="Enter your screen name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border border-gray-200 focus:border-zoom-blue focus:ring-2 focus:ring-blue-100 rounded-xl pl-10 pr-4 py-3 outline-none text-sm w-full transition-all bg-gray-50/30 font-medium placeholder-gray-400"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Error Message display */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-600 font-medium animate-shake">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-zoom-blue hover:bg-blue-600 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 disabled:opacity-75 select-none mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Join Meeting</span>
              )}
            </button>

          </form>

        </div>
      </main>
    </div>
  );
}
