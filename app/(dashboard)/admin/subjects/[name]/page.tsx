import { createClient } from "@/lib/supabase/server";
import { BookOpen, Users, ArrowLeft, Mail, CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function SubjectTeachersView({ 
  params 
}: { 
  params: Promise<{ name: string }> 
}) {
  const supabase = await createClient();
  const { name } = await params;
  const subjectName = decodeURIComponent(name);

  // 1. Fetch all schedules for this department to find out who teaches it
  const { data: departmentSchedules } = await supabase
    .from("teacher_schedules")
    .select(`
      teacher_id,
      teacher:profiles ( id, full_name, email )
    `)
    .eq("department", subjectName);

  // 2. Filter down to a unique list of teachers
  const uniqueTeachersMap = new Map();
  if (departmentSchedules) {
    departmentSchedules.forEach((row: any) => {
      if (row.teacher && !uniqueTeachersMap.has(row.teacher.id)) {
        uniqueTeachersMap.set(row.teacher.id, row.teacher);
      }
    });
  }
  const teachers = Array.from(uniqueTeachersMap.values());

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-[#F8FAFC] min-h-screen">
      
      {/* 🏛️ DEPARTMENT HEADER */}
      <div className="flex items-center justify-between bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/admin" className="inline-flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 hover:text-white transition-all">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black tracking-tight uppercase">{subjectName} Department</h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <Users size={14} /> {teachers.length} Faculty Members
          </p>
        </div>
        <BookOpen size={120} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
      </div>

      {/* 👥 TEACHER DIRECTORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher: any) => (
          <Link 
            key={teacher.id} 
            href={`/admin/teachers/${teacher.id}/schedule`}
            className="group block bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {teacher.full_name?.[0]}
                </div>
                
                {/* Info */}
                <div>
                  <h3 className="font-black text-slate-800 tracking-tight text-lg group-hover:text-blue-600 transition-colors">
                    {teacher.full_name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 mt-1">
                    <Mail size={12} className="text-slate-300" /> {teacher.email}
                  </p>
                </div>
              </div>

              {/* Action Icon */}
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <ChevronRight size={20} />
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View Timetable</span>
               <CalendarDays size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* EMPTY STATE */}
      {teachers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Users size={40} className="text-slate-300" />
          </div>
          <p className="text-slate-900 font-black uppercase tracking-widest text-sm">No Teachers Found</p>
          <p className="text-slate-400 text-xs mt-2 font-bold max-w-[250px] leading-relaxed">
            Upload a {subjectName} CSV schedule in the Faculty Directory to populate this list.
          </p>
        </div>
      )}
    </div>
  );
}