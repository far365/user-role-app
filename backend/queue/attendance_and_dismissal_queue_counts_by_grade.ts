import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface AttendanceAndDismissalQueueCountsByGradeRequest {
  param1: string;
  param2: string;
}

export const attendanceAndDismissalQueueCountsByGrade = api(
  { method: "POST", path: "/attendance-and-dismissal-queue-counts-by-grade", expose: true },
  async (req: AttendanceAndDismissalQueueCountsByGradeRequest): Promise<any[]> => {
    const { data, error } = await supabase.rpc('attendance_and_dismissal_queue_counts_by_grade', {
      param1: req.param1,
      param2: req.param2
    });

    if (error) {
      throw new Error(`Supabase RPC error: ${error.message}`);
    }

    return data || [];
  }
);