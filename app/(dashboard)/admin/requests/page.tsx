import { createClient } from "@/lib/supabase/server";
import { updateRequestStatus } from "@/lib/actions"; // Ensure this handles email sending
import { Clock, User, CheckCircle, XCircle, AlertCircle, Mail } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function RequestsPage() {
  const supabase = await createClient();

  // 1. Fetch requests + Join with profile data
  const { data: requests } = await supabase
    .from("requests")
    .select(`
      *,
      teacher:teacher_id ( full_name, email, department )
    `)
    .eq("status", "pending")
    .order("date_needed", { ascending: true });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Substitution Command Center</h1>
          <p className="text-slate-500 font-medium">Review pending leaves and assign automated matches.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {requests?.map(async (req) => {
          // 2. SMART MATCH: Fetch available teachers for this specific request
          const { data: available } = await supabase.rpc('get_available_teachers', {
            req_date: req.date_needed,
            req_start: req.period.split(' - ')[0],
            req_end: req.period.split(' - ')[1],
            req_teacher_id: req.teacher_id
          });

          return (
            <div key={req.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* LEFT: Request Summary */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">Pending</span>
                    <span className="text-xs font-bold text-slate-400">{req.date_needed}</span>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{(req.teacher as any)?.full_name}</h2>
                    <p className="text-sm text-slate-500 font-medium italic">" {req.reason || "No reason provided."} "</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm font-bold text-slate-700">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                      <Clock size={16} className="text-slate-400" />
                      {req.period}
                    </div>
                    <div className="text-blue-600">Subject: {req.subject}</div>
                  </div>
                  
                  {/* Basic Actions */}
                  <form className="flex gap-2 pt-2">
                    <button
                      formAction={async () => {
                        "use server";
                        await updateRequestStatus(req.id, "rejected");
                        revalidatePath('/admin/requests');
                      }}
                      className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                    >
                      <XCircle size={14} /> Deny Request
                    </button>
                  </form>
                </div>

                {/* RIGHT: Smart Match Suggestions */}
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" /> System Suggested Substitutes
                  </h3>

                  <div className="space-y-3">
                    {available && available.length > 0 ? (
                      available.map((sub: any) => (
                        <div key={sub.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                              {sub.full_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{sub.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Free during this slot</p>
                            </div>
                          </div>
                          
                          <form>
                            <button
                              formAction={async () => {
                                "use server";
                                // This action should: 1. Set status to approved, 2. Set substitute_id, 3. Send Resend Email
                                await updateRequestStatus(req.id, "approved", sub.id, sub.email);
                                revalidatePath('/admin/requests');
                              }}
                              className="bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                              <Mail size={12} /> Assign & Notify
                            </button>
                          </form>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs font-bold">
                        <AlertCircle size={18} /> No free teachers found for this slot.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {requests?.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">All caught up!</p>
            <p className="text-slate-300 text-xs mt-1">No pending substitution requests.</p>
          </div>
        )}
      </div>
    </div>
  );
}