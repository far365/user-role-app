import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { GetAbsenceHistoryResponse } from "./types";

export const getAbsenceHistoryByStudentID = api<{ studentID: string }, GetAbsenceHistoryResponse>(
  { expose: true, method: "GET", path: "/student/absence-history/:studentID" },
  async ({ studentID }) => {
    try {
      const { data, error } = await supabase.rpc('get_absence_history_by_studentid', {
        p_studentid: studentID
      });

      if (error) {
        console.error(`[Student API] Error fetching absence history for student ${studentID}:`, error);
        throw APIError.internal(`Failed to fetch absence history: ${error.message}`);
      }

      return { absenceHistory: data || [] };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Student API] Unexpected error fetching absence history:", error);
      throw APIError.internal("Failed to fetch absence history");
    }
  }
);
