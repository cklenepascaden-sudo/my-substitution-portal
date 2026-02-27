import { createClient } from "@/lib/supabase/server";
import { Users, FileWarning, CalendarCheck, Clock, UserMinus, UserCheck, ArrowRight } from "lucide-react";
import DateFilter from "./DateFilter";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  
  // 1. Get the date from URL or default to TODAY
  const params = await searchParams;
  const selectedDate = params.date || new Date().toISOString().split("T")[0];

  // 2. Fetch Global Stats
  const { count: pendingCount } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: teacherCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher");

  // 3. Fetch Substitutions for the SPECIFIC SELECTED DATE
  const { data: daySubs, count: activeSubs } = await supabase
    .from("requests")
    .select(`
      id,
      subject,
      period,
      date_needed,
      absent_teacher:teacher_id ( full_name ),
      substitute_teacher:substitute_id ( full_name )
    `)
    .eq("status", "approved")
    .eq("date_needed", selectedDate);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HEADER & DATE PICKER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 font-medium">
            Viewing records for <span className="text-blue-600 font-bold underline decoration-blue-200 underline-offset-4">{selectedDate}</span>
          </p>
        </div>

        {/* Client Component for interactivity */}
        <DateFilter selectedDate={selectedDate} />
      </div>
      
      {/* STATS CARDS */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Requests</h3>
            <FileWarning className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{pendingCount || 0}</div>
          <p className="text-xs text-orange-600 font-bold mt-1 uppercase tracking-tighter">Needs Attention</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Teachers</h3>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{teacherCount || 0}</div>
          <p className="text-xs text-blue-600 font-bold mt-1 uppercase tracking-tighter">Registered Faculty</p>
        </div>
        
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Subs Assigned</h3>
            <CalendarCheck className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{activeSubs || 0}</div>
          <p className="text-xs text-green-600 font-bold mt-1 uppercase tracking-tighter">Approved for {selectedDate}</p>
        </div>
      </div>

      {/* SUBSTITUTION MONITOR */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={20} /> 
            Substitution Monitor
          </h2>
          <div className="flex gap-2">
             {selectedDate === new Date().toISOString().split("T")[0] && (
               <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                 Live Today
               </span>
             )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                <th className="px-8 py-4">Absent Teacher</th>
                <th className="px-8 py-4">Coverage Details</th>
                <th className="px-8 py-4">Assigned Substitute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daySubs && daySubs.length > 0 ? (
                daySubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-500 group-hover:bg-red-100 transition-colors">
                          <UserMinus size={16} />
                        </div>
                        <span className="font-bold text-slate-700">{(sub.absent_teacher as any)?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900">{sub.subject}</div>
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tighter">
                          <Clock size={12} /> {sub.period}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <ArrowRight size={14} className="text-slate-300" />
                        <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
                          <UserCheck size={16} />
                        </div>
                        <span className="font-bold text-slate-700">{(sub.substitute_teacher as any)?.full_name || "Unassigned"}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <CalendarCheck size={48} className="text-slate-300" />
                      <p className="font-black text-xs uppercase tracking-widest">No substitutions scheduled for this date</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}