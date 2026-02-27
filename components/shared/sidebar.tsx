"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, ClipboardList, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Define your BCNSHS departments here
const departments = ["MATH", "ENGLISH", "SCIENCE", "FILIPINO", "MAPEH", "TLE", "ESP", "AP"];

export function Sidebar({ role }: { role: "admin" | "teacher" }) {
  const pathname = usePathname();

  const links = role === "admin" 
    ? [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "Teachers", href: "/admin/teachers", icon: Users },
        { name: "Schedules", href: "/admin/schedules", icon: Calendar },
        { name: "Requests", href: "/admin/requests", icon: ClipboardList },
      ]
    : [
        { name: "My Schedule", href: "/teacher", icon: LayoutDashboard },
        { name: "New Request", href: "/teacher/request", icon: ClipboardList },
        { name: "History", href: "/teacher/history", icon: Calendar },
      ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-8">
      {/* 📌 MAIN MENU OPTIONS */}
      <nav className="flex flex-col gap-2 p-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all font-bold",
                isActive 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <link.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* 📚 SUBJECT HUB (ADMIN ONLY) */}
      {role === "admin" && (
        <div className="mt-4 px-4">
          <div className="flex items-center gap-2 px-3 mb-3">
            <div className="h-px bg-slate-200 flex-1"></div>
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Subject Hub
            </p>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <nav className="flex flex-col gap-1">
            {departments.map((dept) => {
              const href = `/admin/subjects/${dept}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={dept}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all font-bold group",
                    isActive 
                      ? "bg-blue-50 text-blue-700 border border-blue-100" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  )}
                >
                  <BookOpen className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-300 group-hover:text-blue-500 transition-colors")} />
                  {dept}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}