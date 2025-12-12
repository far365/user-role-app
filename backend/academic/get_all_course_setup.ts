import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";
import type { CourseSetup } from "./types";

export const getAllCourseSetup = api(
  { method: "GET", path: "/academic/courses", expose: true },
  async (): Promise<{ courses: CourseSetup[] }> => {
    const { data, error } = await supabase
      .from("course_setup")
      .select("*")
      .order("grade_level", { ascending: true })
      .order("course_name", { ascending: true });

    if (error) {
      throw APIError.internal("Failed to fetch course setup", error);
    }

    return { courses: data || [] };
  }
);
