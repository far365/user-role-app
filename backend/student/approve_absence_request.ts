import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface ApproveAbsenceRequestRequest {
  absencercdid: number;
  p_approver_note?: string;
  p_userid: string;
}

export interface ApproveAbsenceRequestResponse {
  status: 'Success' | 'Failed';
  absencercdid: number;
}

export const approveAbsenceRequest = api<ApproveAbsenceRequestRequest, ApproveAbsenceRequestResponse>(
  { expose: true, method: "POST", path: "/student/approve-absence-request" },
  async ({ absencercdid, p_approver_note, p_userid }) => {
    if (!absencercdid) {
      throw APIError.invalidArgument("Absence record ID is required");
    }

    if (!p_userid) {
      throw APIError.invalidArgument("User ID is required");
    }

    try {
      console.log(`[Student API] Approving absence request: ${absencercdid}`);
      
      const { data, error } = await supabase.rpc('approve_absence_request', {
        p_absencercdid: absencercdid,
        p_approver_note: p_approver_note || null,
        p_userid: p_userid
      });

      if (error) {
        console.error("Approve absence request error:", error);
        return {
          status: 'Failed',
          absencercdid
        };
      }

      console.log(`[Student API] Successfully approved absence request: ${absencercdid}`);
      return {
        status: 'Success',
        absencercdid
      };

    } catch (error) {
      console.error("Unexpected error approving absence request:", error);
      return {
        status: 'Failed',
        absencercdid
      };
    }
  }
);
