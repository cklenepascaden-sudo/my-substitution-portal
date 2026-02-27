import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect("/login");
  }

  // 2. Fetch Role with error logging
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (dbError) {
    console.error("❌ DB Role Fetch Error:", dbError.message);
    // If you see the recursion error in the logs here, 
    // it means the SQL in Step 1 didn't run correctly.
  }

  // 3. Determine role safely
  // We check the DB profile first, then fallback to user_metadata
  const userRole = profile?.role || user.user_metadata?.role || "teacher";

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-gray-50/40 lg:block">
        <Sidebar role={userRole} />
      </aside>
      <div className="flex flex-col">
        <Navbar userEmail={user.email} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}