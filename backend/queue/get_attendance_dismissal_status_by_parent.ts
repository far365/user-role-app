import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface AttendanceDismissalRecord {
  queueid: string;
  studentid: string;
  StudentName: string;
  AttendanceStatusAndTime: string;
  DismissalStatusAndTime: string;
  DismissalMethod: string;
  DismissalPickupBy: string;
}

interface AttendanceDismissalResponse {
  data: AttendanceDismissalRecord[];
}

export const getAttendanceDismissalStatusByParent = api(
  { method: "POST", path: "/queue/get-attendance-dismissal-status-by-parent", expose: true },
  async ({ timezone, parentId }: { timezone: string; parentId: string }): Promise<AttendanceDismissalResponse> => {
    console.log(`=== GET ATTENDANCE DISMISSAL STATUS BY PARENT ===`);
    console.log(`Input parameters: timezone="${timezone}", parentId="${parentId}"`);
    
    try {
      const { data, error } = await supabase.rpc('get_attendance_dismissal_status_by_parent', { 
        sch_tz: timezone, 
        p_parentid: parentId 
      });
      
      console.log(`Supabase RPC Result:`);
      console.log(`- Error:`, error);
      console.log(`- Data (raw):`, data);
      console.log(`- Data type:`, typeof data);
      console.log(`- Data length:`, Array.isArray(data) ? data.length : 'not an array');
      console.log(`- Data stringified:`, JSON.stringify(data, null, 2));
      
      if (error) {
        console.error(`Supabase RPC error details:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { data: [] };
      }
      
      const result = { data: data || [] };
      console.log(`Final result:`, JSON.stringify(result, null, 2));
      console.log(`=== END GET ATTENDANCE DISMISSAL STATUS BY PARENT ===`);
      
      return result;
    } catch (err) {
      console.error(`Exception caught:`, err);
      console.log(`=== END GET ATTENDANCE DISMISSAL STATUS BY PARENT (ERROR) ===`);
      return { data: [] };
    }
  }
);
