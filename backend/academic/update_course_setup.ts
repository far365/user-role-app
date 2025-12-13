import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";

export interface UpdateCourseSetupRequest {
  course_code: string;
  course_name: string;
  subject: string;
  grade_level: string;
  credits: number;
  term: string;
  color: string;
  max_enrollment: number;
  description: string;
}

export const updateCourseSetup = api(
  { method: "PUT", path: "/academic/courses/:course_code", expose: true },
  async (req: UpdateCourseSetupRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.rpc("update_course_setup", {
      p_course_code: req.course_code,
      p_course_name: req.course_name,
      p_subject: req.subject,
      p_grade_level: req.grade_level,
      p_credits: req.credits,
      p_term: req.term,
      p_color: req.color,
      p_max_enrollment: req.max_enrollment,
      p_description: req.description,
    });

    if (error) {
      throw APIError.internal("Failed to update course setup", error);
    }

    return { success: true };
  }
);
