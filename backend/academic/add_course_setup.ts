import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";

export interface AddCourseSetupRequest {
  course_code: string;
  course_name: string;
  grade_level: string;
  color: string;
  max_enrollment: string;
  min_teachers: number;
  min_assistants: number;
  description: string;
}

export const addCourseSetup = api(
  { method: "POST", path: "/academic/courses", expose: true },
  async (req: AddCourseSetupRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.rpc("add_course_setup", {
      p_course_code: req.course_code,
      p_course_name: req.course_name,
      p_grade_level: req.grade_level,
      p_color: req.color,
      p_max_enrollment: req.max_enrollment,
      p_min_teachers: req.min_teachers,
      p_min_assistants: req.min_assistants,
      p_description: req.description,
    });

    if (error) {
      throw APIError.internal("Failed to add course setup", error);
    }

    return { success: true };
  }
);
