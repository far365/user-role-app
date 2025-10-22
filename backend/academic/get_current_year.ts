import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { AcademicYear } from "./types";

export const getCurrentYear = api(
  { method: "GET", path: "/academic/current", expose: true },
  async (): Promise<AcademicYear> => {
    const { data, error } = await supabase.rpc("get_current_academic_year");
    
    console.log("Raw RPC response:", JSON.stringify({ data, error }, null, 2));
    console.log("Data type:", typeof data);
    console.log("Is array:", Array.isArray(data));
    
    if (error) {
      throw new Error(error.message);
    }
    
    const rawData = Array.isArray(data) ? data[0] : data;
    
    return {
      ayid: rawData.ayid,
      start_date: rawData.FirstDay,
      end_date: rawData.LastDay,
    };
  }
);
