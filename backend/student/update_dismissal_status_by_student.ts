import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface UpdateDismissalStatusRequest {
  studentId: string;
  dismissalQueueStatus: string;
  addToQueueMethod: string;
  dismissedAt: Date;
  userId: string;
}

interface UpdateDismissalStatusResponse {
  success: boolean;
  error?: string;
  studentId?: string;
  newStatus?: string;
  updatedData?: any;
  debugInfo?: {
    inputStudentId: string;
    inputDismissalQueueStatus: string;
    inputAddToQueueMethod: string;
    inputDismissedAt: string;
    inputUserId: string;
    timestamp: string;
    supabaseResponse?: any;
    supabaseError?: any;
    exception?: string;
  };
}

export const updateDismissalStatusByStudent = api(
  { method: "POST", path: "/student/update-dismissal-status", expose: true },
  async ({ 
    studentId, 
    dismissalQueueStatus, 
    addToQueueMethod, 
    dismissedAt, 
    userId 
  }: UpdateDismissalStatusRequest): Promise<UpdateDismissalStatusResponse> => {
    const timestamp = new Date().toISOString();
    
    console.log(`=== UPDATE INDIVIDUAL STUDENT DISMISSAL STATUS ===`);
    console.log(`📥 RAW INPUT PARAMETERS:`);
    console.log(`   - studentId: "${studentId}"`);
    console.log(`   - dismissalQueueStatus: "${dismissalQueueStatus}"`);
    console.log(`   - addToQueueMethod: "${addToQueueMethod}"`);
    console.log(`   - dismissedAt: "${dismissedAt}"`);
    console.log(`   - userId: "${userId}"`);
    console.log(`   - timestamp: ${timestamp}`);
    
    try {
      console.log(`🔧 SUPABASE RPC PARAMETERS:`);
      console.log(`   - Function: update_dismissal_status_by_student`);
      console.log(`   - p_studentid: "${studentId}"`);
      console.log(`   - p_dismissalqueuestatus: "${dismissalQueueStatus}"`);
      console.log(`   - p_addtoqueuemethod: "${addToQueueMethod}"`);
      console.log(`   - p_dismissedat: "${dismissedAt.toISOString()}"`);
      console.log(`   - p_userid: "${userId}"`);
      
      const { data, error } = await supabase.rpc('update_dismissal_status_by_student', {
        p_studentid: studentId,
        p_dismissalqueuestatus: dismissalQueueStatus,
        p_addtoqueuemethod: addToQueueMethod,
        p_dismissedat: dismissedAt.toISOString(),
        p_userid: userId
      });
      
      console.log(`📤 SUPABASE RPC RESPONSE:`);
      console.log(`   - Error:`, error);
      console.log(`   - Data (raw):`, data);
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
            inputDismissalQueueStatus: dismissalQueueStatus,
            inputAddToQueueMethod: addToQueueMethod,
            inputDismissedAt: dismissedAt.toISOString(),
            inputUserId: userId,
            timestamp,
            supabaseError: error
          }
        };
      }

      const rowsUpdated = typeof data === 'number' ? data : (data ? 1 : 0);
      
      console.log(`✅ UPDATE SUCCESSFUL:`);
      console.log(`   - Rows updated: ${rowsUpdated}`);
      console.log(`   - Stored procedure result:`, data);
      
      const result = { 
        success: true, 
        studentId: studentId,
        newStatus: dismissalQueueStatus,
        updatedData: data,
        debugInfo: {
          inputStudentId: studentId,
          inputDismissalQueueStatus: dismissalQueueStatus,
          inputAddToQueueMethod: addToQueueMethod,
          inputDismissedAt: dismissedAt.toISOString(),
          inputUserId: userId,
          timestamp: timestamp,
          supabaseResponse: data
        }
      };
      
      console.log(`📋 FINAL RESULT:`, JSON.stringify(result, null, 4));
      console.log(`=== END UPDATE INDIVIDUAL STUDENT DISMISSAL STATUS ===`);
      
      return result;
    } catch (err) {
      console.error(`💥 EXCEPTION CAUGHT:`);
      console.error(`   - Error:`, err);
      console.error(`   - Error message:`, err instanceof Error ? err.message : 'Unknown error');
      console.log(`=== END UPDATE INDIVIDUAL STUDENT DISMISSAL STATUS (ERROR) ===`);
      
      return { 
        success: false, 
        error: `Exception: ${err instanceof Error ? err.message : 'Unknown error'}`,
        debugInfo: {
          inputStudentId: studentId,
          inputDismissalQueueStatus: dismissalQueueStatus,
          inputAddToQueueMethod: addToQueueMethod,
          inputDismissedAt: dismissedAt.toISOString(),
          inputUserId: userId,
          timestamp,
          exception: err instanceof Error ? err.message : String(err)
        }
      };
    }
  }
);
