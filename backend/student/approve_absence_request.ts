import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface ApproveAbsenceRequestRequest {
  absencercdid: number;
}

export interface ApproveAbsenceRequestResponse {
  success: boolean;
  absencercdid: number;
}

export const approveAbsenceRequest = api<ApproveAbsenceRequestRequest, ApproveAbsenceRequestResponse>(
  { expose: true, method: "POST", path: "/student/approve-absence-request" },
  async ({ absencercdid }) => {
    if (!absencercdid) {
      throw APIError.invalidArgument("Absence record ID is required");
    }

    try {
      console.log(`[Student API] Approving absence request: ${absencercdid}`);
      
      const { data, error } = await supabase
        .from('absencercd')
        .update({ 
          approvalstatus: 'Approved'
        })
        .eq('absencercdid', absencercdid)
        .select()
        .single();

      if (error) {
        console.error("Approve absence request error:", error);
        throw APIError.internal(`Failed to approve absence request: ${error.message}`);
      }

      if (!data) {
        throw APIError.notFound(`Absence request with ID ${absencercdid} not found`);
      }

      console.log(`[Student API] Successfully approved absence request: ${absencercdid}`);
      return {
        success: true,
        absencercdid
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error approving absence request:", error);
      throw APIError.internal("Failed to approve absence request");
    }
  }
);
