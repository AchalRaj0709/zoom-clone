"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, FileText, Clock, AlertCircle, Loader2 } from "lucide-react";

export default function ScheduleMeeting() {
  const router = useRouter();
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default date and time (today, and next hour) on load
  useEffect(() => {
    const today = new Date();
    
    // YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);

    // Round up to next hour
    const hh = String((today.getHours() + 1) % 24).padStart(2, '0');
    setTime(`${hh}:00`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a meeting title.");
      return;
    }
    if (!date || !time) {
      setError("Please select both a date and a time.");
      return;
    }

    setLoading(true);

    try {
      // Combine date and time into ISO string
      // Format: YYYY-MM-DDTHH:MM:SS
      const scheduledAt = `${date}T${time}:00`;

      const res = await fetch("/api/meetings/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          scheduled_at: scheduledAt,
          duration_minutes: Number(duration),
        }),
      });

      if (res.ok) {
        // Redirect to Dashboard and trigger the toast via query parameter
        router.push("/?scheduled=true");
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || "Failed to schedule meeting.");
      }
    } catch (err) {
      console.error("Error scheduling meeting:", err);
      setError("Could not connect to the server. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-800 flex flex-col font-sans">
      
      {/* Header */}
      <header className="h-16 px-6 flex items-center border-b border-gray-200/50 bg-white">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-zoom-blue transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-6 my-4">
        <div className="bg-white border border-gray-200 shadow-xl rounded-3xl p-6 md:p-8 max-w-lg w-full">
          
          {/* Section Header */}
          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <div className="bg-gray-100 text-gray-700 p-3.5 rounded-2xl">
              <Calendar className="w-7 h-7 text-gray-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">Schedule a Meeting</h1>
            <p className="text-sm text-gray-500">Configure parameters for your upcoming session</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Topic / Title
              </label>
              <input
                id="title"
                type="text"
                required
                placeholder="e.g. Marketing Sync Meeting"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-gray-200 focus:border-zoom-blue focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 outline-none text-sm transition-all bg-gray-50/30 font-medium placeholder-gray-400"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Description (Optional)
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  placeholder="Provide meeting agenda or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="border border-gray-200 focus:border-zoom-blue focus:ring-2 focus:ring-blue-100 rounded-xl pl-10 pr-4 py-2.5 outline-none text-sm w-full transition-all bg-gray-50/30 font-medium placeholder-gray-400 resize-none"
                />
                <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="date" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-gray-200 focus:border-zoom-blue focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 outline-none text-sm transition-all bg-gray-50/30 font-medium text-gray-700"
                />
              </div>

              {/* Time */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="time" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Time
                </label>
                <input
                  id="time"
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="border border-gray-200 focus:border-zoom-blue focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 outline-none text-sm transition-all bg-gray-50/30 font-medium text-gray-700"
                />
              </div>

            </div>

            {/* Duration Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="duration" className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Duration</span>
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="border border-gray-200 focus:border-zoom-blue focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 outline-none text-sm transition-all bg-gray-50/30 font-medium text-gray-700 cursor-pointer"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour (60 min)</option>
                <option value={90}>1.5 hours (90 min)</option>
                <option value={120}>2 hours (120 min)</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-600 font-medium mt-1">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 border border-gray-200 hover:bg-gray-50 font-bold text-sm py-3 rounded-xl transition-all select-none text-gray-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-[2] bg-zoom-blue hover:bg-blue-600 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 disabled:opacity-75 select-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <span>Schedule Meeting</span>
                )}
              </button>
            </div>

          </form>

        </div>
      </main>
    </div>
  );
}
