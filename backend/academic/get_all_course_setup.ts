import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";
import type { CourseSetup } from "./types";

export const getAllCourseSetup = api(
  { method: "GET", path: "/academic/courses", expose: true },
  async (): Promise<{ courses: CourseSetup[] }> => {
    const { data, error } = await supabase
      .rpc("get_all_course_setup");

    if (error) {
      throw APIError.internal("Failed to fetch course setup", error);
    }

    return { courses: data || [] };
  }
);
