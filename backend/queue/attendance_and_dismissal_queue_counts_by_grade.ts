import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface CountsResponse {
  data: { count: number }[];
}

export const attendanceAndDismissalQueueCountsByGrade = api(
  { method: "POST", path: "/adttendance_and_dismissal_queue_counts_by_grade", expose: true },
  async ({ sch_tz , p_grade  }: { sch_tz : string; p_grade : string }): Promise<CountsResponse> => {
    console.log(`=== RAW DATA DUMP ===`);
    console.log(`Input parameters: sch_tz="${sch_tz}", p_grade="${p_grade}"`);
    
    try {
      const { data, error } = await supabase.rpc('attendance_and_dismissal_queue_counts_by_grade', { sch_tz , p_grade  });
      
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
      console.log(`=== END RAW DATA DUMP ===`);
      
      return result;
    } catch (err) {
      console.error(`Exception caught:`, err);
      console.log(`=== END RAW DATA DUMP (ERROR) ===`);
      return { data: [] };
    }
  }
);