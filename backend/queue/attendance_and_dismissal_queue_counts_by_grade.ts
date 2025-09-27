import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface CountsResponse {
  data: { count: number }[];
}

export const attendanceAndDismissalQueueCountsByGrade = api(
  { method: "POST", path: "/attendance-dismissal-counts", expose: true },
  async ({ param1, param2 }: { param1: string; param2: string }): Promise<CountsResponse> => {
    const { data, error } = await supabase.rpc('attendance_and_dismissal_queue_counts_by_grade', { param1, param2 });
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return { data: data || [] };
  }
);