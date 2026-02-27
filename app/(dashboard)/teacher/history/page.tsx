import { createClient } from "@/lib/supabase/server";
import { History, CheckCircle, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SubstitutionHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = new Date().toISOString().split('T')[0];

  // Fetch approved substitutions where I was the sub AND the date is in the past
  const { data: history } = await supabase
    .from('requests')
    .select(`*, original_teacher:teacher_id ( full_name )`)
    .eq('substitute_id', user.id)
    .eq('status', 'approved')
    .lt('date_needed', today)
    .order('date_needed', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <Link href="/teacher/schedule" className="group flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Schedule
      </Link>
      
      <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <History size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Completed Substitution Duties</h1>
            <p className="text-slate-500 font-medium text-sm italic">Historical record of all classes you've covered.</p>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-3xl border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Subject</th>
                <th className="px-8 py-5">Original Teacher</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history && history.length > 0 ? history.map((sub) => (
                <tr key={sub.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-500 italic">{sub.date_needed}</td>
                  <td className="px-8 py-5 font-black text-slate-900">{sub.subject}</td>
                  <td className="px-8 py-5 text-slate-600 font-medium">{(sub.original_teacher as any)?.full_name}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-4 py-1.5 rounded-full uppercase tracking-widest">
                      <CheckCircle size={12} /> Completed
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300">
                    <History size={40} className="mx-auto mb-2 opacity-20" />
                    <p className="font-bold text-xs uppercase tracking-widest">No past duties found</p>
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