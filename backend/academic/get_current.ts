import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { AcademicYear } from "./types";

export const getCurrent = api(
  { method: "GET", path: "/academic/current", expose: true },
  async (): Promise<AcademicYear> => {
    const { data, error } = await supabase
      .from("academicyear")
      .select("ayid, start_date, end_date")
      .eq("is_current", true)
      .single();

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
