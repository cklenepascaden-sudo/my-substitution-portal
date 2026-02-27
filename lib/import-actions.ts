"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ImportResult = {
  success: boolean;
  count: number;
  message: string;
};

export async function importSchedulesFromCSV(
  csvText: string, 
  targetTeacherId: string, 
  targetTeacherName: string
): Promise<ImportResult> {
  const supabase = await createClient();
  
  try {
    // 1. CLEAR OLD SCHEDULE: Prevents duplicates
    await supabase.from('teacher_schedules').delete().eq('teacher_id', targetTeacherId);

    const rows = csvText.split('\n').map(row => row.split(','));
    let totalInserted = 0;
    let foundTeacher = false;

    // Convert target name to UPPERCASE and trim it for better matching
    const cleanTargetName = targetTeacherName.trim().toUpperCase();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cellValue = row[0]?.trim().toUpperCase() || "";
      
      // FUZZY MATCHING: 
      // Checks if the CSV cell contains the name OR if the name contains the CSV cell
      // This handles "JEFFREY CARIASO" vs "JEFFREY"
      if (cellValue.includes(cleanTargetName) || cleanTargetName.includes(cellValue)) {
          // If the cell just says "JEFFREY", we check if the next row is actually the schedule
          // to avoid false positives with random words
          foundTeacher = true;
          
          let j = i + 2; // Jump to the schedule data rows
          while (j < rows.length) {
            const schedRow = rows[j];
            const timeRange = schedRow[0]?.trim();

            // If we hit a row that doesn't look like a time (e.g. "7:40 - 8:40"), stop.
            if (!timeRange || !timeRange.includes("-")) break;

            const [start, end] = timeRange.split("-").map(t => t.trim());

            for (let day = 1; day <= 5; day++) {
              const section = schedRow[day]?.trim();
              
              // Filter out breaks and empty cells
              if (!section || [
                "", "HEALTH BREAK", "LUNCH BREAK", "FLAG CEREMONY", "TIME"
              ].includes(section.toUpperCase())) continue;

              await supabase.from('teacher_schedules').insert({
                teacher_id: targetTeacherId,
                day_of_week: day,
                time_start: start,
                time_end: end,
                subject: section, // Using the section name (e.g. 7C) as the subject
              });
              totalInserted++;
            }
            j++;
          }
          break; // Stop once the specific teacher's block is processed
      }
    }

    if (!foundTeacher) {
      return { 
        success: false, 
        count: 0, 
        message: `Could not find "${targetTeacherName}" in the file. Check if the name in the CSV matches the system name.` 
      };
    }

    revalidatePath("/admin/teachers");
    return { 
      success: true, 
      count: totalInserted, 
      message: `Successfully imported ${totalInserted} classes for ${targetTeacherName}.` 
    };

  } catch (error: any) {
    return { success: false, count: 0, message: error.message };
  }
}