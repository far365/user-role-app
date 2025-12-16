import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { GetClassScheduleByGradeRequest, GetClassScheduleByGradeResponse } from "./types";

export const getClassScheduleByGrade = api(
  { method: "POST", path: "/grades/class-schedule/by-grade", expose: true },
  async (req: GetClassScheduleByGradeRequest): Promise<GetClassScheduleByGradeResponse> => {
    const { timezone, ayid, grade } = req;

    if (!timezone || !ayid || !grade) {
      throw APIError.invalidArgument("Missing required fields: timezone, ayid, grade");
    }

    const { data, error } = await supabase.rpc("get_class_schedule_by_grade", {
      p_timezone: timezone,
      p_ayid: ayid,
      p_grade: grade,
    });

    if (error) {
      console.error("Failed to fetch class schedule:", error);
      throw APIError.internal(`Failed to fetch class schedule: ${error.message}`);
    }

    console.log("=== getClassScheduleByGrade OUTPUT ===");
    console.log("Request params:", { timezone, ayid, grade });
    console.log("Raw data from Supabase:", JSON.stringify(data, null, 2));
    console.log("Number of records:", data?.length || 0);
    console.log("=====================================");

    return {
      schedule: data || [],
    };
  }
);
