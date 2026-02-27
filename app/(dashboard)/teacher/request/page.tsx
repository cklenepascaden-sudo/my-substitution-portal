"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Send, Calendar, Clock, AlertCircle } from "lucide-react";

// Define the schedule type based on our database schema
type ScheduleBlock = {
  id: string;
  subject: string;
  time_start: string;
  time_end: string;
};

export default function NewRequestPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Smart Form State
  const [selectedDate, setSelectedDate] = useState("");
  const [daySchedules, setDaySchedules] = useState<ScheduleBlock[]>([]);
  const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
  const [requestType, setRequestType] = useState<"single" | "whole">("single");
  const [selectedBlockId, setSelectedBlockId] = useState("");

  // 1. Get the current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // 2. Fetch the teacher's schedule whenever they pick a new date
  useEffect(() => {
    async function fetchDaySchedule() {
      if (!selectedDate || !user) return;
      
      setIsFetchingSchedule(true);
      
      // Convert the selected date to a Day of the Week (1 = Monday, 5 = Friday)
      const dateObj = new Date(selectedDate);
      let dayOfWeek = dateObj.getDay(); 
      if (dayOfWeek === 0) dayOfWeek = 7; // Adjust Sunday if needed

      // Query the database for classes they have on this specific day of the week
      const { data, error } = await supabase
        .from("teacher_schedules")
        .select("*")
        .eq("teacher_id", user.id)
        .eq("day_of_week", dayOfWeek)
        .order("time_start", { ascending: true });

      if (!error && data) {
        setDaySchedules(data);
        if (data.length > 0) setSelectedBlockId(data[0].id); // Default to first class
      }
      setIsFetchingSchedule(false);
    }

    fetchDaySchedule();
  }, [selectedDate, user]);

  // 3. Handle Form Submission
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    let finalSubject = "";
    let finalPeriod = "";

    // Format the data based on whether they chose "Whole Day" or "Specific Class"
    if (requestType === "whole") {
      finalSubject = "All Classes (Whole Day)";
      finalPeriod = "Whole Day";
    } else {
      const selectedClass = daySchedules.find(s => s.id === selectedBlockId);
      if (selectedClass) {
        finalSubject = selectedClass.subject;
        finalPeriod = `${selectedClass.time_start.slice(0,5)} - ${selectedClass.time_end.slice(0,5)}`;
      }
    }

    // Insert into the requests table
    const { error } = await supabase.from("requests").insert({
      teacher_id: user?.id,
      date_needed: selectedDate,
      subject: finalSubject,
      period: finalPeriod,
      reason: formData.get("reason"),
      status: "pending" // Admin will review this
    });

    if (!error) {
      router.push("/teacher/history");
    } else {
      alert("Error submitting request: " + error.message);
    }
    
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Request Substitute</h1>
        <p className="text-slate-500 mt-1">Select a date to view your scheduled classes and request cover.</p>
      </div>

      <form onSubmit={onSubmit} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
        
        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            Date of Absence
          </label>
          <input 
            type="date" 
            required 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        {/* Dynamic Schedule Selection (Only shows if a date is picked) */}
        {selectedDate && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
            
            {isFetchingSchedule ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading your schedule for this day...
              </div>
            ) : daySchedules.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4" />
                You do not have any classes scheduled for this day of the week.
              </div>
            ) : (
              <>
                <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Coverage Needed
                </label>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="coverageType" 
                      checked={requestType === "single"} 
                      onChange={() => setRequestType("single")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Specific Class
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="coverageType" 
                      checked={requestType === "whole"} 
                      onChange={() => setRequestType("whole")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Whole Day Leave
                  </label>
                </div>

                {/* Dropdown for specific class selection */}
                {requestType === "single" && (
                  <select 
                    value={selectedBlockId}
                    onChange={(e) => setSelectedBlockId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {daySchedules.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.time_start.slice(0,5)} - {cls.time_end.slice(0,5)} | {cls.subject}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        )}

        {/* Reason for Absence */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Reason</label>
          <textarea 
            name="reason" 
            rows={3} 
            required
            placeholder="Please provide a brief reason for your absence..." 
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
          />
        </div>

        {/* Submit Button */}
        <button 
          disabled={loading || (selectedDate !== "" && daySchedules.length === 0)} 
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 transition-colors shadow-sm"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Submit Request to Admin</>}
        </button>
      </form>
    </div>
  );
}