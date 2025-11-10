import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { GetHifzHistoryByStudentIdRequest, GetHifzHistoryByStudentIdResponse } from "./types";

export const getHistoryByStudentId = api(
  { method: "POST", path: "/hifz/get-history-by-studentid", expose: true },
  async (req: GetHifzHistoryByStudentIdRequest): Promise<GetHifzHistoryByStudentIdResponse> => {
    const { data, error } = await supabase.rpc("get_hifz_history_by_studentid", {
      p_studentid: req.studentId,
      p_prev_rows_count: req.prevRowsCount || null,
      p_start_date: req.startDate || null,
      p_end_date: req.endDate || null,
      p_surah: req.surah || null,
    });

    if (error) {
      throw new Error(`Failed to get hifz history: ${error.message}`);
    }

    return {
      history: data || [],
    };
  }
);
