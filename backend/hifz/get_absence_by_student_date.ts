import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface GetAbsenceByStudentDateRequest {
  studentId: string;
  date: string;
}

export interface AbsenceRecord {
  id: number;
  absenceType: "Excused" | "Unexcused";
  notes?: string;
  teacherId: string;
  date: string;
}

export interface GetAbsenceByStudentDateResponse {
  absence: AbsenceRecord | null;
}

export const getAbsenceByStudentDate = api(
  { method: "POST", path: "/hifz/get-absence-by-student-date", expose: true },
  async (req: GetAbsenceByStudentDateRequest): Promise<GetAbsenceByStudentDateResponse> => {
    try {
      const { data, error } = await supabase
        .from("student_hifz_rcd")
        .select("id, hifzgrade, notes, teacher_id, lesson_date_text")
        .eq("studentid", req.studentId)
        .eq("lesson_date_text", req.date)
        .eq("record_type", "Absence")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw APIError.aborted(error.message);
      }

      if (!data) {
        return { absence: null };
      }

      return {
        absence: {
          id: data.id,
          absenceType: data.hifzgrade as "Excused" | "Unexcused",
          notes: data.notes,
          teacherId: data.teacher_id,
          date: data.lesson_date_text,
        },
      };
    } catch (err: any) {
      if (err instanceof APIError) {
        throw err;
      }
      throw APIError.internal(err.message || "Failed to fetch absence record");
    }
  }
);
