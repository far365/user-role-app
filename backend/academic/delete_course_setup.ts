import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";

export interface DeleteCourseSetupRequest {
  course_code: string;
}

export const deleteCourseSetup = api(
  { method: "DELETE", path: "/academic/courses/:course_code", expose: true },
  async (req: DeleteCourseSetupRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.rpc("delete_course_setup", {
      p_course_code: req.course_code,
    });

    if (error) {
      throw APIError.internal("Failed to delete course setup", error);
    }

    return { success: true };
  }
);
