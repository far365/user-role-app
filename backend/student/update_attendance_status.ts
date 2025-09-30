import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface UpdateAttendanceStatusRequest {
  studentId: string;
  arrivalStatus: string;
}

interface UpdateAttendanceStatusResponse {
  success: boolean;
  error?: string;
  studentId?: string;
  newStatus?: string;
}

export const updateAttendanceStatus = api(
  { method: "POST", path: "/student/update-attendance-status", expose: true },
  async ({ studentId, arrivalStatus }: UpdateAttendanceStatusRequest): Promise<UpdateAttendanceStatusResponse> => {
    console.log(`=== UPDATE INDIVIDUAL STUDENT ATTENDANCE STATUS ===`);
    console.log(`Input parameters: studentId="${studentId}", arrivalStatus="${arrivalStatus}"`);
    
    try {
      const { data, error } = await supabase.rpc('update_student_attendance_status', { 
        p_student_id: studentId, 
        p_arrival_status: arrivalStatus 
      });
      
      console.log(`Supabase RPC Result:`);
      console.log(`- Error:`, error);
      console.log(`- Data (raw):`, data);
      console.log(`- Data type:`, typeof data);
      console.log(`- Data stringified:`, JSON.stringify(data, null, 2));
      
      if (error) {
        console.error(`Supabase RPC error details:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { 
          success: false, 
          error: `Database error: ${error.message}` 
        };
      }
      
      const result = { 
        success: true, 
        studentId: studentId,
        newStatus: arrivalStatus
      };
      console.log(`Final result:`, JSON.stringify(result, null, 2));
      console.log(`=== END UPDATE INDIVIDUAL STUDENT ATTENDANCE STATUS ===`);
      
      return result;
    } catch (err) {
      console.error(`Exception caught:`, err);
      console.log(`=== END UPDATE INDIVIDUAL STUDENT ATTENDANCE STATUS (ERROR) ===`);
      return { 
        success: false, 
        error: `Exception: ${err instanceof Error ? err.message : 'Unknown error'}` 
      };
    }
  }
);