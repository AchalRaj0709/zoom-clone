"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Mic,
  MicOff,
  Video as Camera,
  VideoOff as CameraOff,
  MonitorUp,
  Users,
  PhoneOff,
  Copy,
  Check,
  ChevronLeft,
  Volume2,
  Tv,
  ArrowRight,
  TrendingUp,
  UserCheck
} from "lucide-react";

interface Participant {
  id: number;
  meeting_id: number;
  user_id: number | null;
  display_name: string;
  joined_at: string;
}

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
  participants: Participant[];
}

export default function MeetingRoom() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.meeting_id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Room states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [showParticipantSidebar, setShowParticipantSidebar] = useState(false);
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Ref for polling interval
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Get Initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate a random background color class for guests based on their names
  const getBgColorClass = (name: string) => {
    const colors = [
      "bg-emerald-600",
      "bg-teal-600",
      "bg-cyan-600",
      "bg-purple-600",
      "bg-pink-600",
      "bg-amber-600",
      "bg-indigo-600",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Fetch Meeting Details & Participants list
  const fetchMeetingDetails = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        setError(null);
      } else {
        if (res.status === 404) {
          setError("Meeting room not found.");
        } else {
          setError("An error occurred fetching meeting details.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Checking connection...");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Start polling on mount
  useEffect(() => {
    fetchMeetingDetails(true);
    // Poll every 3 seconds for new participants
    pollingRef.current = setInterval(() => {
      fetchMeetingDetails(false);
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [meetingId]);

  // End Meeting Handler
  const handleEndMeeting = async () => {
    try {
      // Call backend to mark meeting as ended so it moves to history list
      await fetch(`/api/meetings/${meetingId}/end`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Error ending meeting:", err);
    } finally {
      router.push("/");
    }
  };

  // Copy helpers
  const handleCopyLink = () => {
    const fullLink = `${window.location.origin}/join/${meetingId}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(meetingId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zoom-darkBg text-white flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-t-zoom-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400 text-sm mt-2">Connecting to video network...</span>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-zoom-darkBg text-white flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="max-w-md w-full bg-zoom-cardBg border border-gray-800 rounded-3xl p-8 flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold text-red-500">Meeting Room Error</h2>
          <p className="text-gray-400 text-sm">{error || "Could not retrieve meeting room data."}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-zoom-blue hover:bg-blue-600 text-white font-semibold rounded-full text-sm transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Ensure default participant card exists even if backend user list is empty or host is not registered yet
  // We fetch participants from meeting.participants. Let's make sure Achal Raj is listed.
  const participants = meeting.participants && meeting.participants.length > 0
    ? meeting.participants
    : [{ id: 1, meeting_id: 1, user_id: 1, display_name: "Achal Raj", joined_at: new Date().toISOString() }];

  const activeCount = participants.length;

  return (
    <div className="min-h-screen bg-zoom-darkBg text-white flex flex-col font-sans select-none overflow-hidden h-screen">
      
      {/* Top Bar: Title & Copiable Info */}
      <header className="h-14 bg-zoom-darkBg/95 border-b border-white/5 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Leave screen"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="font-bold text-sm md:text-base tracking-wide text-gray-100 truncate max-w-[200px] md:max-w-xs">
              {meeting.title}
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
              <span>ID: {meetingId}</span>
              <button onClick={handleCopyId} className="hover:text-white transition-colors" title="Copy Meeting ID">
                {copiedId ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Copy Invite Link Widget */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-xs text-gray-400 font-medium truncate max-w-xs">
            Link: {window.location.origin}/join/{meetingId}
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-semibold text-xs px-3.5 py-1.5 rounded-full border border-white/5 transition-all shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Pane: Room Grid & Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Participants Layout Area */}
        <div className={`flex-1 p-6 flex flex-col justify-center items-center overflow-y-auto transition-all duration-300 ${showParticipantSidebar ? "lg:mr-80" : ""}`}>
          
          {isSharingScreen ? (
            /* Screen Sharing Split Layout */
            <div className="w-full h-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              
              {/* Left Large Screen Tile */}
              <div className="lg:col-span-3 bg-[#0f0f12] border-2 border-emerald-500/80 rounded-2xl p-6 relative flex flex-col justify-between shadow-2xl overflow-hidden min-h-[300px]">
                {/* Visual grid pattern background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    <Tv className="w-4 h-4 animate-pulse" />
                    <span>Sharing Desktop Screen</span>
                  </div>
                  <span className="text-xs text-white/50 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                    1080p Stream
                  </span>
                </div>

                {/* Vector Screen Mockup */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none z-10 mt-4">
                  <div className="max-w-md w-full bg-zoom-cardBg/90 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-sm font-bold text-gray-300">Zoom-Clone Q2 Architecture Report</span>
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="h-4 bg-emerald-500/20 rounded-full w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded-full w-5/6"></div>
                      <div className="h-4 bg-white/10 rounded-full w-1/2"></div>
                    </div>
                    {/* Fake Chart representation */}
                    <div className="h-28 bg-black/40 border border-white/5 rounded-xl flex items-end gap-2.5 p-4 mt-2">
                      <div className="bg-emerald-500 h-[30%] w-full rounded-t-sm"></div>
                      <div className="bg-emerald-500/80 h-[55%] w-full rounded-t-sm"></div>
                      <div className="bg-emerald-500 h-[45%] w-full rounded-t-sm"></div>
                      <div className="bg-emerald-500/60 h-[70%] w-full rounded-t-sm"></div>
                      <div className="bg-emerald-400 h-[95%] w-full rounded-t-sm animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between z-10">
                  <span className="text-sm font-semibold text-white/80">Achal Raj's Presenting Workspace</span>
                  <span className="text-xs text-white/40">You are visible to all attendees</span>
                </div>
              </div>

              {/* Right Vertical Participants Stack */}
              <div className="lg:col-span-1 flex flex-col gap-3 overflow-y-auto max-h-[550px] lg:max-h-none">
                {participants.map((user) => {
                  const isHostSelf = user.display_name === "Achal Raj";
                  const pMuted = isHostSelf ? isMuted : false;
                  const pVideo = isHostSelf ? isVideoOn : true;

                  return (
                    <div
                      key={user.id}
                      className="bg-zoom-cardBg border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] relative shadow-lg group hover:border-white/10 transition-colors"
                    >
                      {pVideo ? (
                        /* Simulated Video Camera Stream Glow */
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-indigo-500/10 rounded-2xl flex items-center justify-center overflow-hidden border border-blue-500/20">
                          {/* Pulsing indicator */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded text-[10px] text-blue-400 font-semibold uppercase tracking-wider backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                            <span>Live</span>
                          </div>
                          
                          {/* Inner Initials */}
                          <div className="w-14 h-14 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/30">
                            {getInitials(user.display_name)}
                          </div>
                        </div>
                      ) : (
                        /* Video Off State */
                        <div className={`w-14 h-14 rounded-full ${getBgColorClass(user.display_name)} text-white flex items-center justify-center font-bold text-xl shadow-md`}>
                          {getInitials(user.display_name)}
                        </div>
                      )}

                      {/* Info & States */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs bg-black/30 px-2 py-1 rounded backdrop-blur-sm z-10">
                        <span className="font-semibold text-white/90 truncate max-w-[80px]">
                          {user.display_name} {isHostSelf && "(You)"}
                        </span>
                        <div>
                          {pMuted ? (
                            <MicOff className="w-3.5 h-3.5 text-red-500 fill-red-500/10" />
                          ) : (
                            <Mic className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* Normal Grid Layout */
            <div className={`w-full max-w-6xl grid gap-4 justify-center items-center ${
              activeCount === 1 ? "grid-cols-1 max-w-lg" : 
              activeCount === 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl" : 
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}>
              {participants.map((user) => {
                const isHostSelf = user.display_name === "Achal Raj";
                const pMuted = isHostSelf ? isMuted : false;
                const pVideo = isHostSelf ? isVideoOn : true;

                return (
                  <div
                    key={user.id}
                    className="bg-zoom-cardBg border border-white/5 rounded-3xl aspect-video flex flex-col items-center justify-center relative shadow-xl hover:border-white/10 transition-all duration-200 group w-full min-h-[180px] sm:min-h-[220px]"
                  >
                    {pVideo ? (
                      /* Simulated active camera stream placeholder */
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-zoom-cardBg rounded-3xl flex flex-col items-center justify-center overflow-hidden border border-blue-500/30">
                        {/* Audio Ripples if not muted */}
                        {!pMuted && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-28 h-28 bg-blue-500/5 rounded-full animate-ping absolute"></div>
                            <div className="w-36 h-36 bg-indigo-500/5 rounded-full animate-ping absolute duration-1000"></div>
                          </div>
                        )}
                        
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 px-2.5 py-0.5 rounded-full text-[10px] text-blue-400 font-bold uppercase tracking-wider backdrop-blur-sm border border-white/5">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                          <span>Camera On</span>
                        </div>

                        <div className="w-16 h-16 rounded-full bg-blue-600/10 text-zoom-blue flex items-center justify-center font-bold text-2xl border border-blue-500/20">
                          {getInitials(user.display_name)}
                        </div>
                      </div>
                    ) : (
                      /* Profile picture state when camera is disabled */
                      <div className={`w-18 h-18 rounded-full ${getBgColorClass(user.display_name)} text-white flex items-center justify-center font-bold text-2xl shadow-xl border-2 border-white/10`}>
                        {getInitials(user.display_name)}
                      </div>
                    )}

                    {/* Microphone status overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 backdrop-blur-sm z-10">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-white/90 truncate">
                          {user.display_name}
                        </span>
                        {isHostSelf && (
                          <span className="text-[10px] text-zoom-blue bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded font-semibold uppercase">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="bg-black/25 p-1 rounded-full">
                        {pMuted ? (
                          <MicOff className="w-4 h-4 text-red-500 fill-red-500/10" />
                        ) : (
                          <Mic className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Dynamic Participants Drawer Panel */}
        <aside className={`absolute top-0 right-0 bottom-0 w-80 bg-zoom-cardBg border-l border-white/5 shadow-2xl flex flex-col z-30 transition-transform duration-300 transform ${showParticipantSidebar ? "translate-x-0" : "translate-x-full"}`}>
          <div className="h-14 border-b border-white/5 px-5 flex items-center justify-between shrink-0 bg-zoom-darkBg/30">
            <span className="font-bold text-sm tracking-wide flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-gray-400" />
              <span>Participants ({activeCount})</span>
            </span>
            <button
              onClick={() => setShowParticipantSidebar(false)}
              className="text-xs font-bold text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {participants.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between bg-zoom-darkBg/40 border border-white/5 rounded-xl p-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getBgColorClass(user.display_name)} text-white`}>
                    {getInitials(user.display_name)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white/95 truncate">
                      {user.display_name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {user.user_id === 1 ? "Host" : "Guest"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.user_id === 1 ? (
                    <>
                      {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5 text-green-400" />}
                      {isVideoOn ? <Camera className="w-3.5 h-3.5 text-green-400" /> : <CameraOff className="w-3.5 h-3.5 text-red-500" />}
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-green-400" />
                      <Camera className="w-3.5 h-3.5 text-green-400" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-zoom-darkBg/20 border-t border-white/5">
            <button
              onClick={handleCopyLink}
              className="w-full bg-zoom-blue hover:bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-500/10"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Invite URL</span>
            </button>
          </div>
        </aside>

      </div>

      {/* Bottom Control Toolbar: Dark & Fixed */}
      <footer className="h-20 bg-zoom-cardBg/90 border-t border-white/5 px-6 flex items-center justify-between shrink-0 relative z-40 backdrop-blur-md">
        
        {/* Left spacer / Audio status indicator */}
        <div className="flex items-center gap-2 w-1/4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Volume2 className="w-4 h-4 text-zoom-blue" />
            <span>Speaker active (Realtek HD)</span>
          </div>
        </div>

        {/* Center Main Controls Row */}
        <div className="flex items-center gap-3">
          
          {/* Mute/Unmute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all select-none border border-white/5 ${
              isMuted 
                ? "bg-red-600/10 hover:bg-red-600/20 text-red-500" 
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="w-5 h-5 fill-red-500/10" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* Camera On/Off Toggle */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all select-none border border-white/5 ${
              !isVideoOn 
                ? "bg-red-600/10 hover:bg-red-600/20 text-red-500" 
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
            }`}
            title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isVideoOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">{isVideoOn ? "Stop Video" : "Start Video"}</span>
          </button>

          {/* Share Screen Toggle */}
          <button
            onClick={() => setIsSharingScreen(!isSharingScreen)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all select-none border border-white/5 ${
              isSharingScreen 
                ? "bg-emerald-600/20 border-emerald-500/20 text-emerald-400" 
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
            }`}
            title={isSharingScreen ? "Stop Screen Share" : "Share Screen"}
          >
            <MonitorUp className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">Share Screen</span>
          </button>

          {/* Participants Side Panel Toggle */}
          <button
            onClick={() => setShowParticipantSidebar(!showParticipantSidebar)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all select-none border border-white/5 relative ${
              showParticipantSidebar 
                ? "bg-zoom-blue/20 border-zoom-blue/20 text-zoom-blue" 
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
            }`}
            title="Toggle Attendee List"
          >
            <Users className="w-5 h-5" />
            {activeCount > 1 && (
              <span className="absolute top-1 right-2.5 bg-zoom-blue text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-zoom-cardBg shadow-sm">
                {activeCount}
              </span>
            )}
            <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">Attendees</span>
          </button>

        </div>

        {/* Right Red Leave/End Action */}
        <div className="w-1/4 flex justify-end">
          <button
            onClick={handleEndMeeting}
            className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-full flex items-center gap-1.5 transition-all shadow-md shadow-red-950/20 border border-red-500/10"
          >
            <PhoneOff className="w-4 h-4 fill-white stroke-none" />
            <span className="hidden sm:inline">End Meeting</span>
            <span className="sm:hidden">End</span>
          </button>
        </div>

      </footer>

    </div>
  );
}
