import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface RejectAbsenceRequestRequest {
  absencercdid: number;
  approver_note?: string;
  userid: number;
}

export interface RejectAbsenceRequestResponse {
  success: boolean;
  absencercdid: number;
}

export const rejectAbsenceRequest = api<RejectAbsenceRequestRequest, RejectAbsenceRequestResponse>(
  { expose: true, method: "POST", path: "/student/reject-absence-request" },
  async ({ absencercdid, approver_note, userid }) => {
    if (!absencercdid) {
      throw APIError.invalidArgument("Absence record ID is required");
    }

    if (!userid) {
      throw APIError.invalidArgument("User ID is required");
    }

    try {
      console.log(`[Student API] Rejecting absence request: ${absencercdid}`);
      
      const { data, error } = await supabase.rpc('reject_absence_request', {
        p_absencercdid: absencercdid,
        p_approver_note: approver_note || null,
        p_userid: userid
      });

      if (error) {
        console.error("Reject absence request error:", error);
        throw APIError.internal(`Failed to reject absence request: ${error.message}`);
      }

      console.log(`[Student API] Successfully rejected absence request: ${absencercdid}`);
      return {
        success: true,
        absencercdid
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error rejecting absence request:", error);
      throw APIError.internal("Failed to reject absence request");
    }
  }
);
