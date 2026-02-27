"use client";
import { useState } from "react";
import { importSchedulesFromCSV } from "@/lib/actions";
import { Upload, FileType, CheckCircle, AlertCircle, Plus, Trash2, Layers } from "lucide-react";

type UploadRow = {
  id: number;
  file: File | null;
  department: string;
};

export default function ImportSchedules({ 
  teacherId, 
  teacherName 
}: { 
  teacherId: string, 
  teacherName: string 
}) {
  // Start with one empty upload row
  const [uploads, setUploads] = useState<UploadRow[]>([
    { id: Date.now(), file: null, department: "" }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Add a new row
  const addRow = () => {
    setUploads([...uploads, { id: Date.now(), file: null, department: "" }]);
  };

  // Remove a row
  const removeRow = (id: number) => {
    if (uploads.length > 1) {
      setUploads(uploads.filter(u => u.id !== id));
    }
  };

  // Update specific row data
  const updateRow = (id: number, field: keyof UploadRow, value: any) => {
    setUploads(uploads.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  // Helper to read file as text asynchronously
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setResults([]);

    // Validation
    const invalidRows = uploads.filter(u => !u.file || !u.department);
    if (invalidRows.length > 0) {
      setResults(["⚠️ Please ensure all rows have both a file and a department selected."]);
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    const newResults: string[] = [];

    // Loop through each uploaded file and run the Scavenger
    for (const row of uploads) {
      if (!row.file) continue;
      
      try {
        const csvText = await readFileAsText(row.file);
        
        const result = await importSchedulesFromCSV(
          csvText, 
          teacherId, 
          teacherName, 
          row.department, 
          "2025-2026", 
          "1st Semester"
        );

        if (result.success) {
          successCount++;
          newResults.push(`✅ ${row.department}: ${result.message}`);
        } else {
          newResults.push(`❌ ${row.department}: ${result.message}`);
        }
      } catch (err) {
        newResults.push(`❌ ${row.department}: File reading failed.`);
      }
    }

    setResults(newResults);
    setIsUploading(false);

    // If all succeeded, reset to a single empty row after 3 seconds
    if (successCount === uploads.length) {
      setTimeout(() => {
        setUploads([{ id: Date.now(), file: null, department: "" }]);
        setResults([]);
      }, 4000);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Layers size={14} /> Bulk Import Subjects
        </h4>
        <button 
          type="button" 
          onClick={addRow}
          className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
        >
          <Plus size={12} /> Add Subject
        </button>
      </div>
      
      <form onSubmit={handleBulkUpload} className="space-y-4">
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
              
              {/* Department Dropdown */}
              <select 
                value={upload.department} 
                onChange={(e) => updateRow(upload.id, "department", e.target.value)} 
                required
                className="w-1/3 bg-white border border-slate-200 rounded-lg px-2 py-2 text-[10px] font-bold text-slate-700 outline-none appearance-none"
              >
                <option value="">Dept...</option>
                <option value="MATH">MATH</option>
                <option value="ENGLISH">ENGLISH</option>
                <option value="SCIENCE">SCIENCE</option>
                <option value="FILIPINO">FILIPINO</option>
                <option value="MAPEH">MAPEH</option>
                <option value="TLE">TLE</option>
                <option value="ESP">ESP</option>
                <option value="AP">AP</option>
              </select>

              {/* File Input */}
              <div className="relative flex-1">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => updateRow(upload.id, "file", e.target.files?.[0] || null)} 
                  required 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full bg-white border border-dashed border-slate-300 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 flex justify-between items-center overflow-hidden">
                  <span className="truncate pr-2">{upload.file ? upload.file.name : "Select CSV..."}</span>
                  <Upload size={12} className={upload.file ? "text-blue-500" : "text-slate-300"} />
                </div>
              </div>

              {/* Delete Row Button */}
              {uploads.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeRow(upload.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Status Log */}
        {results.length > 0 && (
          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {results.map((res, i) => (
              <div key={i} className={`text-[10px] font-bold ${res.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                {res}
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isUploading} 
          className="w-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? "Running Bulk Scavenger..." : "Run Bulk Scavenger"}
        </button>
      </form>
    </div>
  );
}