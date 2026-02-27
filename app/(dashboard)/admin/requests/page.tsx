import { createClient } from "@/lib/supabase/server";
import { updateRequestStatus } from "@/lib/actions";
import { Clock, User, CheckCircle, XCircle, AlertCircle, Mail, ClipboardList, Download, FileText } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function RequestsPage() {
  const supabase = await createClient();

  // 1. Fetch requests including the new activity fields
  const { data: requests } = await supabase
    .from("requests")
    .select(`
      *,
      teacher:teacher_id ( full_name, email, department )
    `)
    .eq("status", "pending")
    .order("date_needed", { ascending: true });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Substitution Command Center</h1>
        <p className="text-slate-500 font-medium">Review pending leaves, check lesson plans, and notify substitutes.</p>
      </div>

      <div className="grid gap-8">
        {requests?.map(async (req) => {
          // 2. SMART MATCH: Fetch available teachers
          const { data: available } = await supabase.rpc('get_available_teachers', {
            req_date: req.date_needed,
            req_start: req.period.split(' - ')[0],
            req_end: req.period.split(' - ')[1],
            req_teacher_id: req.teacher_id
          });

          return (
            <div key={req.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col xl:flex-row gap-10">
                
                {/* LEFT: Request Summary & Activity */}
                <div className="flex-[1.2] space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Pending</span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                        <Clock size={14} /> {req.date_needed}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{(req.teacher as any)?.full_name}</h2>
                    <p className="text-sm text-slate-500 font-bold mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      " {req.reason || "No reason provided."} "
                    </p>
                  </div>

                  {/* 📋 ACTIVITY SECTION - NEW */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                      <ClipboardList size={16} /> Lesson Instructions
                    </h3>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {req.activity_details || "No instructions provided."}
                    </p>
                    
                    {req.activity_file_url && (
                      <a 
                        href={req.activity_file_url} 
                        target="_blank" 
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <Download size={14} /> Download Worksheet
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm font-black uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5 text-slate-500">
                       <FileText size={16} className="text-slate-400" /> {req.subject}
                    </div>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <div className="text-blue-600">{req.period}</div>
                  </div>
                  
                  <form>
                    <button
                      formAction={async () => {
                        "use server";
                        await updateRequestStatus(req.id, "rejected");
                        revalidatePath('/admin/requests');
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition"
                    >
                      Deny Request
                    </button>
                  </form>
                </div>

                {/* RIGHT: Smart Match Suggestions */}
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-[2rem] p-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" /> Automated Matches
                  </h3>

                  <div className="space-y-4">
                    {available && available.length > 0 ? (
                      available.map((sub: any) => (
                        <div key={sub.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-400 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black">
                              {sub.full_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 tracking-tight">{sub.full_name}</p>
                              <p className="text-[9px] text-green-600 font-black uppercase tracking-widest">Available Now</p>
                            </div>
                          </div>
                          
                          <form>
                            <button
                              formAction={async () => {
                                "use server";
                                await updateRequestStatus(req.id, "approved", sub.id, sub.email);
                                revalidatePath('/admin/requests');
                              }}
                              className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
                            >
                              <Mail size={12} /> Assign
                            </button>
                          </form>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                        <AlertCircle size={32} className="text-amber-400" />
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Conflict Detected</p>
                        <p className="text-[9px] text-slate-400 font-bold max-w-[150px]">No teachers are currently free during this time slot.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {requests?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <CheckCircle size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-900 font-black uppercase tracking-widest text-sm">Inbox Zero</p>
            <p className="text-slate-400 text-xs mt-1 font-bold">All substitution requests have been processed.</p>
          </div>
        )}
      </div>
    </div>
  );
}