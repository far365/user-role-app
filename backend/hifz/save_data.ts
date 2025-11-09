import { api } from "encore.dev/api";
import type { SaveHifzDataRequest, SaveHifzDataResponse } from "./types";

export const saveData = api(
  { method: "POST", path: "/hifz/save-data", expose: true },
  async (req: SaveHifzDataRequest): Promise<SaveHifzDataResponse> => {
    return {
      success: true,
    };
  }
);
