import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface InsertStudentHifzRequest {
  recordType: "meaning" | "memorization" | "revision";
  studentId: string;
  surah: string;
  from: string;
  to: string;
  lines: string;
  notes: string;
  addedBy: string;
  lessonDateText: string;
  teacherId: string;
  hifzGrade: string;
}

export interface InsertStudentHifzResponse {
  success: boolean;
  message?: string;
}

export const insertStudentHifz = api(
  { method: "POST", path: "/hifz/insert-student-hifz", expose: true },
  async (req: InsertStudentHifzRequest): Promise<InsertStudentHifzResponse> => {
    try {
      const { data, error } = await supabase.rpc("add_student_hifz_rcd", {
        p_record_type: req.recordType,
        p_studentid: req.studentId,
        p_surah: req.surah,
        p_from: req.from,
        p_to: req.to,
        p_lines: req.lines,
        p_notes: req.notes,
        p_addedby: req.addedBy,
        p_lesson_date_text: req.lessonDateText,
        p_teacher_id: req.teacherId,
        p_hifzgrade: req.hifzGrade,
      });

      if (error) {
        throw APIError.aborted(error.message);
      }

      return {
        success: true,
        message: data,
      };
    } catch (err: any) {
      if (err instanceof APIError) {
        throw err;
      }
      throw APIError.internal(err.message || "Failed to insert hifz record");
    }
  }
);
