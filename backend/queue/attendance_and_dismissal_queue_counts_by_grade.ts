import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface CountsResponse {
  data: { count: number }[];
}

export const attendanceAndDismissalQueueCountsByGrade = api(
  { method: "POST", path: "/attendance-dismissal-counts", expose: true },
  async ({ sch_tz , p_grade  }: { sch_tz : string; p_grade : string }): Promise<CountsResponse> => {
    const { data, error } = await supabase.rpc('attendance_and_dismissal_queue_counts_by_grade', { sch_tz , p_grade  });
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return { data: data || [] };
  }
);