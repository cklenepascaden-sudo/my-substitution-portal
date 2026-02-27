"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export function Navbar({ userEmail }: { userEmail: string | undefined }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-white px-6 lg:h-[60px]">
      <div className="w-full flex-1">
        {/* You can add a search bar here later */}
        <h1 className="text-sm font-medium text-gray-500">Welcome back</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden md:inline-block">{userEmail}</span>
        </div>
        
        <button
          onClick={handleSignOut}
          className="rounded-md p-2 hover:bg-gray-100"
          title="Sign out"
        >
          <LogOut className="h-5 w-5 text-gray-500" />
        </button>
      </div>
    </header>
  );
}