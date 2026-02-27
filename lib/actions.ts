"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ==========================================
// 🕒 HELPER: 12-Hour Converter with AM/PM
// Converts CSV times like "7:40" -> "7:40 AM" and "1:00" -> "1:00 PM"
// Assuming school hours are 6:00 AM to 6:00 PM
// ==========================================
function formatTo12HourString(timeStr: string): string {
  if (!timeStr) return "";
  
  // Clean up any weird characters and split by colon
  const cleanStr = timeStr.replace(/[^0-9:]/g, '');
  const [hourStr, minStr] = cleanStr.split(":");
  
  if (!hourStr) return timeStr;

  let hour = parseInt(hourStr, 10);
  const min = minStr ? minStr.padStart(2, '0') : "00";
  
  let ampm = "AM";

  // Logic: 1 to 5 are afternoon (PM). 12 is noon (PM). 6 to 11 are morning (AM).
  if (hour >= 1 && hour <= 5) {
    ampm = "PM";
  } else if (hour === 12) {
    ampm = "PM";
  } else if (hour >= 6 && hour <= 11) {
    ampm = "AM";
  }
  
  return `${hour}:${min} ${ampm}`;
}


/**
 * ==========================================
 * ACTION 1: Update Request Status 
 * ==========================================
 */
export async function updateRequestStatus(
  requestId: string, 
  status: "approved" | "rejected",
  substituteId?: string,      
  substituteEmail?: string    
) {
  const supabase = await createClient();
  
  const updateData: any = { status: status };
  
  if (status === "approved" && substituteId) {
    updateData.substitute_id = substituteId;
  }

  const { error } = await supabase.from("requests").update(updateData).eq("id", requestId);

  if (error) {
    console.error("Error updating request:", error);
    return { success: false, message: "Failed to update request" };
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  revalidatePath("/teacher/requests");
  revalidatePath("/teacher/schedule");
  
  return { success: true };
}

/**
 * ==========================================
 * ACTION 2: Import Schedules from CSV (Scavenger)
 * ==========================================
 */
export async function importSchedulesFromCSV(
  csvText: string, 
  targetTeacherId: string, 
  targetTeacherName: string,
  department: string, 
  schoolYear: string = "2025-2026",
  semester: string = "1st Semester"
) {
  const supabase = await createClient();
  
  try {
    const rows = csvText.split('\n').map(row => 
      row.split(',').map(cell => cell.trim().replace(/"/g, ""))
    );
    
    let totalInserted = 0;
    let foundTeacher = false;
    
    const searchName = targetTeacherName.split(" ")[0].toUpperCase();

    for (let i = 0; i < rows.length; i++) {
      const rowString = rows[i].join(" ").toUpperCase();
      
      if (rowString.includes(searchName)) {
          if (rowString.includes("INDIVIDUAL") && !rowString.startsWith(searchName)) continue;
          
          foundTeacher = true;

          let j = i + 1; 
          while (j < rows.length) {
            const schedRow = rows[j];
            const timeRange = (schedRow[0] || "").trim();

            if (timeRange.toUpperCase().includes("INDIVIDUAL") || (timeRange === "" && j > i + 5)) break;

            if (timeRange.includes("-")) {
              const [startRaw, endRaw] = timeRange.split("-").map(t => t.trim());
              
              // 🕒 CONVERT TO 12-HOUR AM/PM BEFORE INSERTING
              const start = formatTo12HourString(startRaw);
              const end = formatTo12HourString(endRaw);

              for (let day = 1; day <= 5; day++) {
                const section = schedRow[day]?.trim();
                
                if (!section || [
                  "", "FLAG CEREMONY", "HEALTH BREAK", "LUNCH BREAK", "TIME", "ARAL", "HGP"
                ].includes(section.toUpperCase())) continue;

                // 🛠️ SMART OVERWRITE
                await supabase.from('teacher_schedules')
                  .delete()
                  .match({
                    teacher_id: targetTeacherId,
                    school_year: schoolYear,
                    semester: semester,
                    day_of_week: day,
                    time_start: start // Now matches "7:40 AM" or "1:00 PM"
                  });

                // 📥 INSERT NEW CLASS
                await supabase.from('teacher_schedules').insert({
                  teacher_id: targetTeacherId,
                  day_of_week: day,
                  time_start: start,
                  time_end: end,
                  subject: section,
                  school_year: schoolYear,
                  semester: semester,
                  department: department 
                });
                totalInserted++;
              }
            }
            j++;
          }
          break; 
      }
    }

    revalidatePath(`/admin/teachers/${targetTeacherId}/schedule`);
    revalidatePath(`/admin/subjects/${department}`);

    if (!foundTeacher) {
      return { success: false, message: `Scavenger failed to find "${searchName}".` };
    }

    return { success: true, count: totalInserted, message: `Successfully imported & organized ${totalInserted} classes for ${department}.` };

  } catch (error: any) {
    console.error("Import Error:", error.message);
    return { success: false, message: error.message };
  }
}