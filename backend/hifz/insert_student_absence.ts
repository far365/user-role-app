import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface InsertStudentAbsenceRequest {
  studentId: string;
  absenceType: "Excused" | "Unexcused";
  lessonDateText: string;
  teacherId: string;
  notes?: string;
}

export interface InsertStudentAbsenceResponse {
  success: boolean;
  message?: string;
  recordId?: number;
}

export const insertStudentAbsence = api(
  { method: "POST", path: "/hifz/insert-student-absence", expose: true },
  async (req: InsertStudentAbsenceRequest): Promise<InsertStudentAbsenceResponse> => {
    try {
      const { data, error } = await supabase
        .from("student_hifz_rcd")
        .insert({
          record_type: "Absence",
          studentid: req.studentId,
          hifzgrade: req.absenceType,
          lesson_date_text: req.lessonDateText,
          teacher_id: req.teacherId,
          notes: req.notes || "",
          surah: "",
          from_ayat: "",
          to_ayat: "",
          lines: "",
          addedby: req.teacherId,
        })
        .select("id")
        .single();

      if (error) {
        throw APIError.aborted(error.message);
      }

      return {
        success: true,
        message: "Absence recorded successfully",
        recordId: data?.id,
      };
    } catch (err: any) {
      if (err instanceof APIError) {
        throw err;
      }
      throw APIError.internal(err.message || "Failed to insert absence record");
    }
  }
);
