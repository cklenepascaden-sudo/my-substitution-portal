import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* --- Left Side: Branding & Hero (Visible on Desktop) --- */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white relative">
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
        
        {/* Top: Portal Name */}
        <div className="relative z-20 flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black">
            <span className="text-lg">Automated Substitution Portal</span>
          </div>
         PINGET NATIONAL HIGH SCHOOL
        </div>

        {/* Bottom: Quote/Mission */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium italic leading-relaxed">
              "Ensuring that every classroom remains a center for learning, 
              even when transitions happen. Seamlessly connecting teachers 
              with administration."
            </p>
            <footer className="text-sm text-zinc-400">
              —Pinget National High School
            </footer>
          </blockquote>
        </div>
      </div>

      {/* --- Right Side: The Form Container --- */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-gray-50/50">
        {/* Mobile Header (Visible only on small screens) */}
        <div className="lg:hidden flex flex-col items-center mb-10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-black flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg">
            S
          </div>
          <h2 className="text-xl font-bold"> Portal</h2>
          <p className="text-sm text-gray-500">Substitution & Scheduling System</p>
        </div>

        {/* The actual Login/SignUp Form injected here */}
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
        
        {/* Footer Info */}
        <p className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Portal. <br />
          All rights reserved.
        </p>
      </div>
    </div>
  );
}