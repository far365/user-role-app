import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface CountsResponse {
  data: { count: number }[];
}

export const attendanceAndDismissalQueueCountsByGrade = api(
  { method: "POST", path: "/attendance-dismissal-counts", expose: true },
  async ({ sch_tz , p_grade  }: { sch_tz : string; p_grade : string }): Promise<CountsResponse> => {
    try {
      const { data, error } = await supabase.rpc('attendance_and_dismissal_queue_counts_by_grade', { sch_tz , p_grade  });
      if (error) {
        console.error(`Supabase RPC error: ${error.message}`);
        // Return empty data if function doesn't exist
        return { data: [] };
      }
      return { data: data || [] };
    } catch (err) {
      console.error(`Failed to call Supabase function: ${err}`);
      // Return empty data if function doesn't exist
      return { data: [] };
    }
  }
);