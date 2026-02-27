"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

export default function DateFilter({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (newDate) {
      params.set("date", newDate);
    } else {
      params.delete("date");
    }

    // Refresh the page with the new URL parameter
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
      <Calendar size={18} className="text-slate-400 ml-2" />
      <input 
        type="date" 
        value={selectedDate}
        onChange={handleDateChange}
        className="text-sm font-bold border-none focus:ring-0 cursor-pointer outline-none bg-transparent"
      />
    </div>
  );
}