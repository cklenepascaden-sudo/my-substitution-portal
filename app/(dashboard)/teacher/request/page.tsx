"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Loader2, Send, Calendar, Clock, AlertCircle, 
  ClipboardList, Upload, FileType, CheckCircle 
} from "lucide-react";

type ScheduleBlock = {
  id: string;
  subject: string;
  time_start: string;
  time_end: string;
};

function format12Hour(time24: string) {
  if (!time24) return "";
  const [hourStr, minStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minStr} ${ampm}`;
}

export default function NewRequestPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form States
  const [selectedDate, setSelectedDate] = useState("");
  const [daySchedules, setDaySchedules] = useState<ScheduleBlock[]>([]);
  const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
  const [requestType, setRequestType] = useState<"single" | "whole">("single");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  
  // File Upload State
  const [activityFile, setActivityFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    async function fetchDaySchedule() {
      if (!selectedDate || !user) return;
      setIsFetchingSchedule(true);
      
      const dateObj = new Date(selectedDate);
      let dayOfWeek = dateObj.getDay(); 
      if (dayOfWeek === 0) dayOfWeek = 7; 

      const { data, error } = await supabase
        .from("teacher_schedules")
        .select("*")
        .eq("teacher_id", user.id)
        .eq("day_of_week", dayOfWeek)
        .order("time_start", { ascending: true });

      if (!error && data) {
        setDaySchedules(data);
        if (data.length > 0) setSelectedBlockId(data[0].id);
      }
      setIsFetchingSchedule(false);
    }
    fetchDaySchedule();
  }, [selectedDate, user]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    let finalSubject = "";
    let finalPeriod = "";
    let fileUrl = null;

    try {
      // 1. UPLOAD FILE TO SUPABASE STORAGE (IF FILE EXISTS)
      if (activityFile) {
        const fileExt = activityFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('sub-activities')
          .upload(filePath, activityFile);

        if (uploadError) throw new Error("File upload failed: " + uploadError.message);

        const { data: { publicUrl } } = supabase.storage
          .from('sub-activities')
          .getPublicUrl(filePath);
        
        fileUrl = publicUrl;
      }

      // 2. PREPARE DATA
      if (requestType === "whole") {
        finalSubject = "All Classes (Whole Day)";
        finalPeriod = "Whole Day";
      } else {
        const selectedClass = daySchedules.find(s => s.id === selectedBlockId);
        if (selectedClass) {
          finalSubject = selectedClass.subject;
          finalPeriod = `${format12Hour(selectedClass.time_start)} - ${format12Hour(selectedClass.time_end)}`;
        }
      }

      // 3. INSERT INTO DATABASE
      const { error: dbError } = await supabase.from("requests").insert({
        teacher_id: user?.id,
        date_needed: selectedDate,
        subject: finalSubject,
        period: finalPeriod,
        reason: formData.get("reason"),
        activity_details: formData.get("activity_details"),
        activity_file_url: fileUrl, // 👈 Saved Public URL
        status: "pending"
      });

      if (dbError) throw dbError;

      router.push("/teacher/history");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Request Substitute</h1>
        <p className="text-slate-500 mt-1 font-medium">Notify the admin and provide instructions for your coverage.</p>
      </div>

      <form onSubmit={onSubmit} className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-8">
        
        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Date of Absence</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
            <input 
              type="date" 
              required 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
        </div>

        {/* Dynamic Schedule Selection */}
        {selectedDate && (
          <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
            {isFetchingSchedule ? (
              <div className="flex items-center gap-2 text-sm text-blue-600 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching your classes...
              </div>
            ) : daySchedules.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 font-bold">
                <AlertCircle className="w-4 h-4" /> No classes found for this day.
              </div>
            ) : (
              <>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                  <Clock size={14} /> Select Coverage Scope
                </label>
                
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100 cursor-pointer hover:border-blue-300 transition-all">
                    <input type="radio" name="coverageType" checked={requestType === "single"} onChange={() => setRequestType("single")} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">Specific Class</span>
                  </label>
                  <label className="flex-1 flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100 cursor-pointer hover:border-blue-300 transition-all">
                    <input type="radio" name="coverageType" checked={requestType === "whole"} onChange={() => setRequestType("whole")} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">Whole Day</span>
                  </label>
                </div>

                {requestType === "single" && (
                  <select 
                    value={selectedBlockId}
                    onChange={(e) => setSelectedBlockId(e.target.value)}
                    className="w-full p-3 bg-white border border-blue-100 rounded-xl text-xs font-black text-slate-700 outline-none"
                  >
                    {daySchedules.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {format12Hour(cls.time_start)} — {cls.subject}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        )}

        {/* FILE UPLOAD SECTION */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
            <Upload size={14} className="text-blue-500" /> Activity File (PDF / Images)
          </label>
          <div className="relative group">
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setActivityFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 transition-all">
              {activityFile ? (
                <>
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-sm font-bold text-slate-700">{activityFile.name}</span>
                </>
              ) : (
                <>
                  <FileType className="text-slate-300" size={24} />
                  <span className="text-xs font-bold text-slate-400">Click to upload worksheet</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVITY DETAILS */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
            <ClipboardList size={14} className="text-blue-500" /> Lesson Instructions
          </label>
          <textarea 
            name="activity_details" 
            rows={4} 
            required
            placeholder="Detailed instructions for the substitute..." 
            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
          />
        </div>

        <button 
          disabled={loading || (selectedDate !== "" && daySchedules.length === 0)} 
          className="w-full bg-slate-900 text-white py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Submit Request</>}
        </button>
      </form>
    </div>
  );
}