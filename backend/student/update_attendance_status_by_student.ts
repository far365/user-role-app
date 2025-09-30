import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface UpdateAttendanceStatusRequest {
  studentId: string;
  arrivalStatus: string;
  grade: string;
  userid: string;
}

interface UpdateAttendanceStatusResponse {
  success: boolean;
  error?: string;
  studentId?: string;
  newStatus?: string;
  updatedData?: any;
  debugInfo?: {
    inputStudentId: string;
    inputArrivalStatus: string;
    inputGrade?: string;
    inputUserid?: string;
    timestamp?: string;
    supabaseResponse?: any;
    supabaseError?: any;
    exception?: string;
  };
}

export const updateStudentAttendanceStatus = api(
  { method: "POST", path: "/student/update-attendance-status", expose: true },
  async ({ studentId, arrivalStatus, grade, userid }: UpdateAttendanceStatusRequest): Promise<UpdateAttendanceStatusResponse> => {
    const timestamp = new Date().toISOString();
    
    console.log(`=== UPDATE INDIVIDUAL STUDENT ATTENDANCE STATUS ===`);
    console.log(`📥 RAW INPUT PARAMETERS:`);
    console.log(`   - studentId (raw): "${studentId}"`);
    console.log(`   - studentId (type): ${typeof studentId}`);
    console.log(`   - studentId (length): ${studentId?.length || 'undefined'}`);
    console.log(`   - arrivalStatus (raw): "${arrivalStatus}"`);
    console.log(`   - arrivalStatus (type): ${typeof arrivalStatus}`);
    console.log(`   - arrivalStatus (length): ${arrivalStatus?.length || 'undefined'}`);
    console.log(`   - grade (raw): "${grade}"`);
    console.log(`   - userid (raw): "${userid}"`);
    console.log(`   - timestamp: ${timestamp}`);
    
    try {
      console.log(`🔧 SUPABASE RPC PARAMETERS:`);
      console.log(`   - Function: update_attendance_status_by_student`);
      console.log(`   - p_grade: "${grade}"`);
      console.log(`   - p_arrival_status: "${arrivalStatus}"`);
      console.log(`   - p_userid: "${userid}"`);
      console.log(`   - p_studentid: "${studentId}"`);
      
      // Call the Supabase stored procedure with all required parameters
      const { data, error } = await supabase.rpc('update_attendance_status_by_student', {
        p_grade: grade,
        p_arrival_status: arrivalStatus,
        p_userid: userid,
        p_studentid: studentId
      });
      
      console.log(`📤 SUPABASE RPC RESPONSE:`);
      console.log(`   - Error:`, error);
      console.log(`   - Error (stringified):`, JSON.stringify(error, null, 4));
      console.log(`   - Data (raw):`, data);
      console.log(`   - Data (type):`, typeof data);
      console.log(`   - Data (stringified):`, JSON.stringify(data, null, 4));
      
      if (error) {
        console.error(`❌ SUPABASE ERROR DETAILS:`);
        console.error(`   - Message: ${error.message}`);
        console.error(`   - Details: ${error.details}`);
        console.error(`   - Hint: ${error.hint}`);
        console.error(`   - Code: ${error.code}`);
        return { 
          success: false, 
          error: `Database error: ${error.message}`,
          debugInfo: {
            inputStudentId: studentId,
            inputArrivalStatus: arrivalStatus,
            supabaseError: error
          }
        };
      }

      // The stored procedure should return success info or number of rows affected
      const rowsUpdated = typeof data === 'number' ? data : (data ? 1 : 0);
      
      console.log(`✅ UPDATE SUCCESSFUL:`);
      console.log(`   - Rows updated: ${rowsUpdated}`);
      console.log(`   - Stored procedure result:`, data);
      
      const result = { 
        success: true, 
        studentId: studentId,
        newStatus: arrivalStatus,
        updatedData: data,
        debugInfo: {
          inputStudentId: studentId,
          inputArrivalStatus: arrivalStatus,
          inputGrade: grade,
          inputUserid: userid,
          timestamp: timestamp,
          supabaseResponse: data
        }
      };
      
      console.log(`📋 FINAL RESULT:`, JSON.stringify(result, null, 4));
      console.log(`=== END UPDATE INDIVIDUAL STUDENT ATTENDANCE STATUS ===`);
      
      return result;
    } catch (err) {
      console.error(`💥 EXCEPTION CAUGHT:`);
      console.error(`   - Error:`, err);
      console.error(`   - Error message:`, err instanceof Error ? err.message : 'Unknown error');
      console.error(`   - Error stack:`, err instanceof Error ? err.stack : 'No stack trace');
      console.log(`=== END UPDATE INDIVIDUAL STUDENT ATTENDANCE STATUS (ERROR) ===`);
      
      return { 
        success: false, 
        error: `Exception: ${err instanceof Error ? err.message : 'Unknown error'}`,
        debugInfo: {
          inputStudentId: studentId,
          inputArrivalStatus: arrivalStatus,
          inputGrade: grade,
          inputUserid: userid,
          exception: err instanceof Error ? err.message : String(err)
        }
      };
    }
  }
);