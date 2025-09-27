import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface AttendanceAndDismissalQueueCountsByGradeRequest {
  param1: string;
  param2: string;
}

interface AttendanceAndDismissalQueueCountsByGradeItem {
  count: number;
}

interface AttendanceAndDismissalQueueCountsByGradeResponse {
  data: AttendanceAndDismissalQueueCountsByGradeItem[];
}

export const attendanceAndDismissalQueueCountsByGrade = api(
  { method: "POST", path: "/attendance_and_dismissal_queue_counts_by_grade", expose: true },
  async (req: AttendanceAndDismissalQueueCountsByGradeRequest): Promise<AttendanceAndDismissalQueueCountsByGradeResponse> => {
    const { data, error } = await supabase.rpc('attendance_and_dismissal_queue_counts_by_grade', {
      param1: req.param1,
      param2: req.param2
    });

    if (error) {
      throw new Error(`Supabase RPC error: ${error.message}`);
    }

    return { data: data || [] };
  }
);