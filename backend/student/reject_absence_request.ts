import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface RejectAbsenceRequestRequest {
  absencercdid: number;
}

export interface RejectAbsenceRequestResponse {
  success: boolean;
  absencercdid: number;
}

export const rejectAbsenceRequest = api<RejectAbsenceRequestRequest, RejectAbsenceRequestResponse>(
  { expose: true, method: "POST", path: "/student/reject-absence-request" },
  async ({ absencercdid }) => {
    if (!absencercdid) {
      throw APIError.invalidArgument("Absence record ID is required");
    }

    try {
      console.log(`[Student API] Rejecting absence request: ${absencercdid}`);
      
      const { data, error } = await supabase
        .from('absencercd')
        .update({ 
          approvalstatus: 'Rejected'
        })
        .eq('absencercdid', absencercdid)
        .select()
        .single();

      if (error) {
        console.error("Reject absence request error:", error);
        throw APIError.internal(`Failed to reject absence request: ${error.message}`);
      }

      if (!data) {
        throw APIError.notFound(`Absence request with ID ${absencercdid} not found`);
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
