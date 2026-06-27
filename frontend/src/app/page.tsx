"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Video, 
  Plus, 
  Calendar, 
  MonitorUp, 
  Search, 
  Clock, 
  ArrowRight,
  Play, 
  History, 
  CalendarDays,
  Copy,
  Check
} from "lucide-react";

interface Meeting {
  id: number;
  meeting_id: string;
  title: string;
  description?: string;
  host_id: number;
  invite_link: string;
  scheduled_at?: string;
  duration_minutes: number;
  status: string;
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Meetings from API
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const [upRes, recRes] = await Promise.all([
          fetch("/api/meetings/upcoming"),
          fetch("/api/meetings/recent")
        ]);
        
        if (upRes.ok) {
          const upData = await upRes.json();
          setUpcomingMeetings(upData);
        }
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecentMeetings(recData);
        }
      } catch (err) {
        console.error("Error fetching meetings:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeetings();
  }, []);

  // Format datetime helper
  const formatMeetingTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const copyToClipboard = (meetingId: string) => {
    const fullLink = `${window.location.origin}/join/${meetingId}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter based on search query
  const filteredUpcoming = upcomingMeetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.meeting_id.includes(searchQuery)
  );

  const filteredRecent = recentMeetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.meeting_id.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col font-sans">
      {/* Top Navbar: 64px Height, White with Shadow */}
      <header className="h-16 bg-white border-b border-gray-200/80 shadow-sm px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Zoom Logo */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => router.push("/")}>
            <div className="bg-zoom-blue p-1.5 rounded-xl text-white">
              <Video className="w-6 h-6 fill-white stroke-none" />
            </div>
            <span className="text-zoom-blue font-bold text-2xl tracking-tighter select-none">zoom</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-gray-100 hover:bg-gray-200/70 border border-gray-200 focus-within:border-zoom-blue focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 rounded-full px-4 py-1.5 w-96 transition-all">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search meetings by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 hidden sm:block">Achal Raj</span>
          <div className="w-10 h-10 rounded-full bg-zoom-blue text-white flex items-center justify-center font-semibold text-sm shadow-md hover:opacity-90 cursor-pointer select-none">
            AR
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Actions & Recent Meetings */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Action Tiles Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* New Meeting Button */}
            <button
              onClick={() => router.push("/meeting/new")}
              className="flex flex-col items-center justify-center bg-zoom-orange hover:brightness-110 text-white rounded-3xl p-6 transition-all duration-200 shadow-md shadow-orange-100 group"
            >
              <div className="bg-white/20 p-4 rounded-2xl group-hover:scale-105 transition-transform">
                <Video className="w-8 h-8 fill-white stroke-none" />
              </div>
              <span className="mt-3 font-semibold text-base tracking-wide">New Meeting</span>
              <span className="text-xs text-white/80 mt-0.5">Start instantly</span>
            </button>

            {/* Join Button */}
            <button
              onClick={() => router.push("/join")}
              className="flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200/80 text-gray-800 rounded-3xl p-6 transition-all duration-200 border border-gray-200/40 group"
            >
              <div className="bg-zoom-blue p-4 rounded-2xl text-white group-hover:scale-105 transition-transform shadow-sm shadow-blue-200">
                <Plus className="w-8 h-8 stroke-[3]" />
              </div>
              <span className="mt-3 font-semibold text-base tracking-wide text-gray-800">Join</span>
              <span className="text-xs text-gray-500 mt-0.5">Enter meeting ID</span>
            </button>

            {/* Schedule Button */}
            <button
              onClick={() => router.push("/schedule")}
              className="flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200/80 text-gray-800 rounded-3xl p-6 transition-all duration-200 border border-gray-200/40 group"
            >
              <div className="bg-gray-700/80 p-4 rounded-2xl text-white group-hover:scale-105 transition-transform shadow-sm">
                <Calendar className="w-8 h-8" />
              </div>
              <span className="mt-3 font-semibold text-base tracking-wide text-gray-800">Schedule</span>
              <span className="text-xs text-gray-500 mt-0.5">Plan ahead</span>
            </button>

            {/* Share Screen Button */}
            <button
              onClick={() => alert("Screen sharing is simulated. In a meeting room, click 'Share Screen' in the toolbar to present.")}
              className="flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200/80 text-gray-800 rounded-3xl p-6 transition-all duration-200 border border-gray-200/40 group"
            >
              <div className="bg-gray-700/80 p-4 rounded-2xl text-white group-hover:scale-105 transition-transform shadow-sm">
                <MonitorUp className="w-8 h-8" />
              </div>
              <span className="mt-3 font-semibold text-base tracking-wide text-gray-800">Share Screen</span>
              <span className="text-xs text-gray-500 mt-0.5">Show presentation</span>
            </button>

          </div>

          {/* Recent Meetings Section */}
          <div className="flex-1 bg-gray-50/50 border border-gray-200/60 rounded-3xl p-6 flex flex-col min-h-[350px]">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-800">Recent Meetings</h2>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                Loading history...
              </div>
            ) : filteredRecent.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <p className="text-sm">No recent meetings found.</p>
                <p className="text-xs mt-1">Meetings you end will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1">
                {filteredRecent.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{meeting.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <span>{formatMeetingTime(meeting.created_at)}</span>
                        <span className="inline-block w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>{meeting.duration_minutes} mins</span>
                      </p>
                    </div>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200/50">
                      Ended
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Clock & Upcoming Meetings */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Clock Widget */}
          <div className="bg-gradient-to-br from-zoom-blue to-indigo-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-end min-h-[180px] md:min-h-[220px]">
            {/* Ambient visual glow background */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl pointer-events-none transform translate-x-12 -translate-y-12"></div>
            
            <div className="relative z-10">
              <span className="text-sm font-semibold tracking-wider text-blue-100 uppercase bg-white/15 px-3.5 py-1 rounded-full backdrop-blur-sm select-none">
                Default Host Account
              </span>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight mt-6 md:mt-8 select-none">
                {currentTime || "00:00 AM"}
              </h1>
              <p className="text-blue-100 text-sm md:text-base font-medium mt-1 tracking-wide select-none">
                {currentDate || "Loading date..."}
              </p>
            </div>
          </div>

          {/* Upcoming Meetings Section */}
          <div className="bg-gray-50/50 border border-gray-200/60 rounded-3xl p-6 flex flex-col flex-1 min-h-[300px]">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-800">Upcoming Scheduled Meetings</h2>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                Loading schedules...
              </div>
            ) : filteredUpcoming.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <p className="text-sm">No upcoming meetings scheduled.</p>
                <p className="text-xs mt-1">Schedule a meeting to see it here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[420px] pr-1">
                {filteredUpcoming.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="bg-white border border-gray-200/80 hover:border-zoom-blue/40 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-zoom-blue animate-pulse"></span>
                        <h3 className="font-bold text-gray-900 truncate text-base">{meeting.title}</h3>
                      </div>
                      {meeting.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{meeting.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-xs text-gray-500">
                        <span className="font-semibold text-zoom-blue bg-blue-50 px-2 py-0.5 rounded">
                          {formatMeetingTime(meeting.scheduled_at)}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>ID: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-600">{meeting.meeting_id}</code></span>
                        <span className="text-gray-300">|</span>
                        <span>{meeting.duration_minutes} min duration</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Copy Link Button */}
                      <button
                        onClick={() => copyToClipboard(meeting.meeting_id)}
                        className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-gray-500 hover:text-gray-800"
                        title="Copy Invite Link"
                      >
                        {copiedId === meeting.meeting_id ? (
                          <Check className="w-4.5 h-4.5 text-green-600" />
                        ) : (
                          <Copy className="w-4.5 h-4.5" />
                        )}
                      </button>

                      {/* Start Button */}
                      <button
                        onClick={() => router.push(`/meeting/${meeting.meeting_id}`)}
                        className="bg-zoom-blue hover:bg-blue-600 text-white font-semibold text-sm px-5 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-sm shadow-blue-200"
                      >
                        <Play className="w-3.5 h-3.5 fill-white stroke-none" />
                        <span>Start</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
