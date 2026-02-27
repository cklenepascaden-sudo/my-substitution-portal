import { createClient } from "@/lib/supabase/server";
import { Mail, User, Calendar } from "lucide-react"; // Added Calendar icon
import { redirect } from "next/navigation";
import Link from "next/link"; // Added Link for navigation

export default async function TeacherDashboard() {
  const supabase = await createClient();

  // 1. Verify the user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch all users with the role 'teacher' for the directory
  const { data: teachers, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "teacher")
    .order("full_name", { ascending: true });

  if (error) {
    return <div className="p-4 text-red-500 bg-red-50 rounded-md">Error loading teachers: {error.message}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Welcome Header (Updated with Schedule Button) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.user_metadata?.full_name || 'Teacher'}
          </h1>
          <p className="text-gray-500 mt-1">
            Automated Substitution Portal
          </p>
        </div>
        
        {/* NEW: Navigation Button to the Schedule Page */}
        <Link 
          href="/teacher/schedule" 
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          <Calendar className="w-5 h-5" />
          View My Schedule
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Faculty Directory</h2>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 border border-blue-200">
            Total Faculty: {teachers?.length || 0}
          </span>
        </div>

        {/* Table Container */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Contact</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Department</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {!teachers || teachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center italic text-gray-500">
                      No teachers found.
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      {/* Name Column */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {teacher.full_name || "Unknown Name"}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {teacher.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${teacher.email}`} className="hover:text-blue-600 hover:underline">
                            {teacher.email}
                          </a>
                        </div>
                      </td>

                      {/* Department Column */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {teacher.department || "Unassigned"}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}