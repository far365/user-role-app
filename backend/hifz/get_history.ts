import { api } from "encore.dev/api";
import type { GetHifzHistoryRequest, GetHifzHistoryResponse } from "./types";

export const getHistory = api(
  { method: "POST", path: "/hifz/get-history", expose: true },
  async (req: GetHifzHistoryRequest): Promise<GetHifzHistoryResponse> => {
    return {
      history: [],
    };
  }
);
