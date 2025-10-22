import { api } from "encore.dev/api";
import { supabase } from "./supabase";

export interface UpdateAttendanceStatusByGradeRequest {
  grade: string;
  arrivalStatus: "OnTime" | "OnTime-M" | "Tardy" | "Tardy-M" | "ExcusedDelay" | "NoShow" | "Unknown";
  userid: string;
}

export interface UpdateAttendanceStatusByGradeResponse {
  success: boolean;
  rowsUpdated: number;
  error?: string;
}

export const updateAttendanceStatusByGrade = api(
  { method: "POST", path: "/user/update_attendance_status_by_grade", expose: true },
  async (req: UpdateAttendanceStatusByGradeRequest): Promise<UpdateAttendanceStatusByGradeResponse> => {
    try {
      console.log("🚀 UPDATE ATTENDANCE API - Starting request:");
      console.log("  Grade:", req.grade);
      console.log("  Arrival Status:", req.arrivalStatus);
      console.log("  User ID:", req.userid);

      // Call the Supabase stored procedure
      const { data, error } = await supabase.rpc('update_attendance_status_by_grade', {
        p_grade: req.grade,
        p_arrival_status: req.arrivalStatus,
        p_userid: req.userid
      });

      console.log("📥 UPDATE ATTENDANCE API - Supabase response:");
      console.log("  Data:", data);
      console.log("  Error:", error);

      if (error) {
        console.error("❌ UPDATE ATTENDANCE API - Supabase error:", error);
        return {
          success: false,
          rowsUpdated: 0,
          error: error.message
        };
      }

      // The stored procedure should return the number of rows updated
      const rowsUpdated = typeof data === 'number' ? data : 0;
      
      console.log("✅ UPDATE ATTENDANCE API - Success:");
      console.log("  Rows updated:", rowsUpdated);

      return {
        success: true,
        rowsUpdated: rowsUpdated
      };

    } catch (error) {
      console.error("💥 UPDATE ATTENDANCE API - Unexpected error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        rowsUpdated: 0,
        error: errorMessage
      };
    }
  }
);