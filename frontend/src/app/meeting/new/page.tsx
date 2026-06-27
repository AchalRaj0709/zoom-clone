"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Loader2 } from "lucide-react";

export default function NewMeeting() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createInstantMeeting = async () => {
      try {
        const res = await fetch("/api/meetings/instant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          // Redirect to the newly created meeting room
          router.replace(`/meeting/${data.meeting_id}`);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.detail || "Failed to create instant meeting.");
        }
      } catch (err) {
        console.error("Error creating instant meeting:", err);
        setError("Could not connect to the backend server. Please verify the backend is running on port 8000.");
      }
    };

    createInstantMeeting();
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col items-center justify-center font-sans p-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
        
        {/* Loading Visual */}
        <div className="relative flex items-center justify-center">
          <div className="bg-zoom-blue text-white p-5 rounded-3xl animate-pulse shadow-lg shadow-blue-100">
            <Video className="w-10 h-10 fill-white stroke-none" />
          </div>
          <div className="absolute -inset-2 border-2 border-t-zoom-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin w-24 h-24 mx-auto"></div>
        </div>

        <div>
          {error ? (
            <>
              <h2 className="text-xl font-bold text-red-600">Error Creating Meeting</h2>
              <p className="text-gray-500 text-sm mt-2">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 px-6 py-2.5 bg-zoom-blue hover:bg-blue-600 text-white font-semibold rounded-full text-sm transition-all shadow-sm shadow-blue-200"
              >
                Back to Dashboard
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Starting Your Meeting</h2>
              <p className="text-gray-500 text-sm mt-2 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zoom-blue" />
                <span>Securing a private video room...</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
