import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface ClassTimingsRequest {
  grade: string;
}

export interface ClassTimingsResponse {
  startTime: string;
  endTime: string;
}

export const classTimings = api(
  { method: "GET", path: "/grades/:grade/class-timings", expose: true },
  async ({ grade }: ClassTimingsRequest): Promise<ClassTimingsResponse> => {
    const { data, error } = await supabase
      .from("gradeattributes")
      .select("starttime, endtime")
      .eq("grade", grade)
      .single();

    if (error || !data) {
      throw APIError.notFound(`No class timings found for grade: ${grade}`);
    }

    return {
      startTime: data.starttime,
      endTime: data.endtime,
    };
  }
);
