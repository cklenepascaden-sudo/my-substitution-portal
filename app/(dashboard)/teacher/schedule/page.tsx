import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Clock, Trash2, Calendar as CalendarIcon, Mail, Tag, BookOpen, GraduationCap, Layers, Plus, CalendarDays, FolderOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const allDepartments = ["MATH", "ENGLISH", "SCIENCE", "FILIPINO", "MAPEH", "TLE", "ESP", "AP"];

// ==========================================
// 🕒 HELPER: Format 24hr DB time to 12hr UI time
// e.g., "13:00" -> "1:00 PM"
// ==========================================
function format12Hour(time24: string) {
  if (!time24) return "";
  const [hourStr, minStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  
  return `${hour}:${minStr} ${ampm}`;
}

export default async function TeacherScheduleEditor({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ semester?: string; year?: string; subject?: string }>
}) {
  const { id } = await params;
  const { semester = "1st Semester", year = "2025-2026", subject: selectedSubject } = await searchParams;
  const supabase = await createClient();

  // 1. Fetch Teacher Info
  const { data: teacher } = await supabase.from("profiles").select("full_name, email").eq("id", id).single();

  // 2. Fetch All Schedules for this Teacher
  const { data: schedule } = await supabase
    .from("teacher_schedules")
    .select("*")
    .eq("teacher_id", id)
    .eq("school_year", year)
    .eq("semester", semester)
    .order("day_of_week", { ascending: true })
    .order("time_start", { ascending: true }); // Database sorts by 24hr correctly!

  const totalClasses = schedule?.length || 0;

  // 3. Extract Unique Departments this teacher actually teaches
  const uniqueTeacherDepartments = Array.from(new Set(schedule?.map(s => s.department).filter(Boolean) as string[]));

  // --- SERVER ACTIONS ---
  async function deleteScheduleBlock(formData: FormData) {
    "use server";
    const blockId = formData.get("blockId");
    const supabase = await createClient();
    await supabase.from("teacher_schedules").delete().eq("id", blockId);
    revalidatePath(`/admin/teachers/${id}/schedule`);
  }

  async function addScheduleBlock(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const dayOfWeek = formData.get("day_of_week");
    
    await supabase.from("teacher_schedules").insert({
      teacher_id: id,
      day_of_week: dayOfWeek ? parseInt(dayOfWeek as string) : null,
      time_start: formData.get("time_start"),
      time_end: formData.get("time_end"),
      subject: formData.get("subject"),
      department: formData.get("department"),
      school_year: formData.get("school_year"),
      semester: formData.get("semester"),
      specific_date: formData.get("specific_date") || null,
    });
    
    revalidatePath(`/admin/teachers/${id}/schedule`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 min-h-screen bg-[#F8FAFC]">
      
      {/* 🚀 HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link href="/admin/teachers" className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-slate-600">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
              {teacher?.full_name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Mail size={14} className="text-blue-500" /> {teacher?.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
             <Layers size={16} className="text-blue-500" />
             <span className="text-[11px] font-black uppercase text-slate-700 tracking-tight">{semester}</span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
             <GraduationCap size={18} className="text-indigo-500" />
             <span className="text-[11px] font-black uppercase text-slate-700 tracking-tight">{year}</span>
           </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: SUBJECT FOLDERS (Shows if no subject is clicked) */}
      {/* ========================================================= */}
      {!selectedSubject && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 lg:p-12 shadow-sm min-h-[600px]">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                 <FolderOpen size={24} />
               </div>
               <div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Assigned Subjects</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select a folder to view the timetable</p>
               </div>
             </div>
             <div className="px-5 py-2 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Load</p>
                <p className="text-lg font-black text-white leading-none mt-1">{totalClasses} Classes</p>
             </div>
          </div>

          {uniqueTeacherDepartments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uniqueTeacherDepartments.map(dept => {
                const deptCount = schedule?.filter(s => s.department === dept).length;
                return (
                  <Link 
                    key={dept}
                    href={`/admin/teachers/${id}/schedule?subject=${dept}&semester=${semester}&year=${year}`}
                    className="group bg-slate-50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 tracking-tight text-xl group-hover:text-blue-600 transition-colors">{dept}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{deptCount} Sessions</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
               <BookOpen size={48} className="text-slate-200 mb-4" />
               <p className="font-black text-slate-900 uppercase tracking-widest text-sm">No Subjects Assigned</p>
               <p className="text-slate-400 text-xs mt-2 font-bold">Import a CSV from the directory to populate folders.</p>
             </div>
          )}

          <div className="mt-16 pt-10 border-t border-slate-100">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Quick Manual Entry</h3>
             <form action={addScheduleBlock} className="flex gap-4 items-end bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <input type="hidden" name="school_year" value={year} />
                <input type="hidden" name="semester" value={semester} />
                
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dept</label>
                  <select name="department" required className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none">
                    <option value="">Select...</option>
                    {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Day</label>
                  <select name="day_of_week" required className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none">
                    {days.map((day, idx) => <option key={day} value={idx + 1}>{day.substring(0,3)}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Start</label>
                  <input type="time" name="time_start" required className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">End</label>
                  <input type="time" name="time_end" required className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
                  <input type="text" name="subject" placeholder="e.g. 10-Rizal" required className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none" />
                </div>
                <button type="submit" className="h-10 px-6 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
                  Add
                </button>
             </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: CALENDAR STYLE TIMETABLE (Shows if subject clicked) */}
      {/* ========================================================= */}
      {selectedSubject && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 lg:p-12 shadow-sm min-h-[700px]">
          
          <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-4">
               <Link href={`/admin/teachers/${id}/schedule`} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                 <ArrowLeft size={20} />
               </Link>
               <div>
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><CalendarDays size={16} /></div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{selectedSubject} Calendar</h2>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-[2.25rem]">Weekly Breakdown</p>
               </div>
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-black uppercase tracking-widest">
              {schedule?.filter(s => s.department === selectedSubject).length} Sessions
            </div>
          </div>
          
          {/* CALENDAR GRID */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {days.map((dayName, index) => {
              const dayNum = index + 1;
              const classesForDay = schedule?.filter((s) => s.day_of_week === dayNum && s.department === selectedSubject) || [];

              return (
                <div key={dayNum} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-4 flex flex-col h-full">
                  <div className="text-center pb-4 mb-4 border-b border-slate-200/60">
                    <span className="block text-sm font-black text-slate-800 uppercase tracking-widest">{dayName}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{classesForDay.length} Classes</span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {classesForDay.map((cls) => (
                      <div key={cls.id} className="group relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-sm font-black text-slate-900 block">{cls.subject}</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mt-2 bg-slate-50 px-2 py-1 rounded-md w-fit">
                              <Clock size={10} className="text-blue-500" />
                              {/* 🕒 HERE IS WHERE THE MAGIC HAPPENS! */}
                              {format12Hour(cls.time_start)} - {format12Hour(cls.time_end)}
                            </div>
                          </div>
                        </div>
                        
                        <form action={deleteScheduleBlock} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input type="hidden" name="blockId" value={cls.id} />
                          <button type="submit" className="p-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </form>
                      </div>
                    ))}
                    
                    {classesForDay.length === 0 && (
                      <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300">
                        Free Day
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}