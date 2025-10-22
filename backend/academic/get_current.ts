import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { AcademicYear } from "./types";

export const getCurrent = api(
  { method: "GET", path: "/academic/current", expose: true },
  async (): Promise<AcademicYear> => {
    const { data, error } = await supabase
      .rpc("get_current_academic_year");

    console.log("Raw API response:", JSON.stringify({ data, error }, null, 2));

    if (error) {
      throw APIError.notFound("No current academic year found");
    }

    if (!data) {
      throw APIError.notFound("No current academic year found");
    }

    return {
      ayid: data.ayid,
      start_date: data.start_date,
      end_date: data.end_date,
    };
  }
);
