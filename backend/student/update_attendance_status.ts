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
  updatedData?: any;
  debugInfo?: {
    inputStudentId: string;
    inputArrivalStatus: string;
    timestamp?: string;
    supabaseResponse?: any;
    supabaseError?: any;
    exception?: string;
  };
}

export const updateAttendanceStatus = api(
  { method: "POST", path: "/student/update-attendance-status", expose: true },
  async ({ studentId, arrivalStatus }: UpdateAttendanceStatusRequest): Promise<UpdateAttendanceStatusResponse> => {
    const timestamp = new Date().toISOString();
    
    console.log(`=== UPDATE INDIVIDUAL STUDENT ATTENDANCE STATUS ===`);
    console.log(`📥 RAW INPUT PARAMETERS:`);
    console.log(`   - studentId (raw): "${studentId}"`);
    console.log(`   - studentId (type): ${typeof studentId}`);
    console.log(`   - studentId (length): ${studentId?.length || 'undefined'}`);
    console.log(`   - arrivalStatus (raw): "${arrivalStatus}"`);
    console.log(`   - arrivalStatus (type): ${typeof arrivalStatus}`);
    console.log(`   - arrivalStatus (length): ${arrivalStatus?.length || 'undefined'}`);
    console.log(`   - timestamp: ${timestamp}`);
    
    try {
      // Log the exact update object being sent to Supabase
      const updateObject = { 
        attendanceStatus: arrivalStatus,
        updatedAt: timestamp
      };
      
      console.log(`🔧 SUPABASE UPDATE PARAMETERS:`);
      console.log(`   - Table: studentrcd`);
      console.log(`   - Update Object:`, JSON.stringify(updateObject, null, 4));
      console.log(`   - Where Condition: studentId = "${studentId}"`);
      console.log(`   - Select: * (return updated data)`);
      
      // Update the student's attendance status directly in the studentrcd table
      const { data, error } = await supabase
        .from('studentrcd')
        .update(updateObject)
        .eq('studentId', studentId)
        .select();
      
      console.log(`📤 SUPABASE RESPONSE:`);
      console.log(`   - Error:`, error);
      console.log(`   - Error (stringified):`, JSON.stringify(error, null, 4));
      console.log(`   - Data (raw):`, data);
      console.log(`   - Data (type):`, typeof data);
      console.log(`   - Data (array length):`, Array.isArray(data) ? data.length : 'not array');
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

      // Check if any rows were updated
      if (!data || data.length === 0) {
        console.warn(`⚠️  NO ROWS UPDATED:`);
        console.warn(`   - Possible reasons:`);
        console.warn(`     1. Student ID "${studentId}" not found in studentrcd table`);
        console.warn(`     2. Row Level Security (RLS) blocking the update`);
        console.warn(`     3. Table/column name mismatch`);
        
        return {
          success: false,
          error: `No student found with ID: ${studentId}`,
          debugInfo: {
            inputStudentId: studentId,
            inputArrivalStatus: arrivalStatus,
            supabaseData: data
          }
        };
      }
      
      console.log(`✅ UPDATE SUCCESSFUL:`);
      console.log(`   - Rows updated: ${data.length}`);
      console.log(`   - Updated student data:`, JSON.stringify(data[0], null, 4));
      
      const result = { 
        success: true, 
        studentId: studentId,
        newStatus: arrivalStatus,
        updatedData: data[0],
        debugInfo: {
          inputStudentId: studentId,
          inputArrivalStatus: arrivalStatus,
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
          exception: err instanceof Error ? err.message : String(err)
        }
      };
    }
  }
);