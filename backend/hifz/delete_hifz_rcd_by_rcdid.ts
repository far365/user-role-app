import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { DeleteHifzRcdByRcdIdRequest, DeleteHifzRcdByRcdIdResponse } from "./types";

export const deleteHifzRcdByRcdId = api(
  { method: "POST", path: "/hifz/delete-rcd-by-rcdid", expose: true },
  async (req: DeleteHifzRcdByRcdIdRequest): Promise<DeleteHifzRcdByRcdIdResponse> => {
    try {
      const { error } = await supabase
        .from("student_hifz_rcd")
        .delete()
        .eq("id", req.rcdId);

      if (error) {
        console.error("Failed to delete hifz record:", error);
        return {
          success: false,
          message: `Failed to delete record: ${error.message}`,
        };
      }

      return {
        success: true,
        message: "Record deleted successfully",
      };
    } catch (err: any) {
      console.error("Failed to delete hifz record:", err);
      return {
        success: false,
        message: `Failed to delete record: ${err.message}`,
      };
    }
  }
);
