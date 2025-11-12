import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { GetHifzHistoryByParentIdRequest, GetHifzHistoryByParentIdResponse } from "./types";

export const getHistoryByParentId = api(
  { method: "POST", path: "/hifz/get-history-by-parentid", expose: true },
  async (req: GetHifzHistoryByParentIdRequest): Promise<GetHifzHistoryByParentIdResponse> => {
    const { data, error } = await supabase.rpc("get_hifz_history_by_parentid", {
      p_parentid: req.parentId,
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
