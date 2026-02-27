import { createClient } from "@/lib/supabase/server";
import { Mail, Shield, User as UserIcon, BookOpen } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import ImportSchedules from "./ImportSchedules";

export default async function TeachersPage() {
  const supabase = await createClient();

  const { data: teachers, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    return <div className="p-4 text-red-500">Error loading directory.</div>;
  }

  async function toggleRole(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const currentRole = formData.get("currentRole") as string;
    const newRole = currentRole === "admin" ? "teacher" : "admin";

    const supabase = await createClient();
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    revalidatePath("/admin/teachers");
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Faculty Directory</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage accounts and import individual teacher schedules from Excel/CSV.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teachers?.map((teacher) => (
          <div key={teacher.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col justify-between">
            
            <div>
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <UserIcon size={24} />
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-slate-900 leading-none truncate text-lg">
                      {teacher.full_name || "Unknown User"}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-bold truncate">
                      <Mail size={12} className="flex-shrink-0" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                  </div>
                </div>
                
                {teacher.role === 'admin' && (
                  <span className="bg-blue-600 text-white px-3 py-1 flex-shrink-0 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Shield size={10} /> Admin
                  </span>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">
                {/* 👈 REPLACED: Edit Sched Button is now a Direct Link to the Teacher's individual schedule AND a quick link dropdown to subjects */}
                <Link 
                  href={`/admin/teachers/${teacher.id}/schedule`}
                  className="flex-1 text-center text-[10px] font-black uppercase tracking-widest py-3 border-2 border-blue-100 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen size={14} /> Personal Sched
                </Link>
                
                <form action={toggleRole} className="flex-1">
                  <input type="hidden" name="userId" value={teacher.id} />
                  <input type="hidden" name="currentRole" value={teacher.role} />
                  <button 
                    type="submit" 
                    className={`w-full text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl transition-all
                      ${teacher.role === 'admin' 
                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                        : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                  >
                    {teacher.role === 'admin' ? 'Demote' : 'Promote'}
                  </button>
                </form>
              </div>
            </div>

            {/* CSV IMPORT AREA FOR THIS SPECIFIC TEACHER */}
            <ImportSchedules 
              teacherId={teacher.id} 
              teacherName={teacher.full_name || ""} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}