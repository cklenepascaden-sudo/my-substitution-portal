import { createClient } from "@/lib/supabase/server";

export default async function SchedulesPage() {
  const supabase = await createClient();

  const { data: schedule } = await supabase
    .from("requests")
    .select(`
      *,
      teacher:teacher_id ( full_name, department )
    `)
    .eq("status", "approved")
    .order("date_needed", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Substitution Schedule</h1>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Period</th>
              <th className="px-6 py-3">Teacher</th>
              <th className="px-6 py-3">Subject</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {schedule?.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 font-medium">{item.date_needed}</td>
                <td className="px-6 py-4">{item.period}</td>
                <td className="px-6 py-4">
                  {/* @ts-ignore */}
                  {item.teacher?.full_name}
                </td>
                <td className="px-6 py-4">{item.subject}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Approved
                  </span>
                </td>
              </tr>
            ))}
            {schedule?.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-4 text-center">No active schedule.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}