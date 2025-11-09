import { api } from "encore.dev/api";
import type { GetHifzDataRequest, GetHifzDataResponse } from "./types";

export const getData = api(
  { method: "POST", path: "/hifz/get-data", expose: true },
  async (req: GetHifzDataRequest): Promise<GetHifzDataResponse> => {
    return {
      data: {
        meaning: [],
        memorization: [],
        revision: [],
      },
    };
  }
);
