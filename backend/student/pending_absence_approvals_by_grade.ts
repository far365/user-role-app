import { api, APIError, Query } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface PendingAbsenceApprovalsByGradeRequest {
  grade: Query<string>;
}

export interface AbsenceRequest {
  absencercdid: number;
  studentid: number;
  studentname: string;
  grade: string;
  absencedate: string;
  fullday: boolean;
  absencestarttm?: string;
  absenceendtm?: string;
  approvalstatus: string;
  requester_note?: string;
  createdon: string;
}

export interface PendingAbsenceApprovalsByGradeResponse {
  requests: AbsenceRequest[];
  grade: string;
  totalCount: number;
}

export const pendingAbsenceApprovalsByGrade = api<PendingAbsenceApprovalsByGradeRequest, PendingAbsenceApprovalsByGradeResponse>(
  { expose: true, method: "GET", path: "/student/pending-absence-approvals-by-grade" },
  async ({ grade }) => {
    if (!grade || !grade.trim()) {
      throw APIError.invalidArgument("Grade is required");
    }

    try {
      console.log(`[Student API] Getting pending absence approvals for grade: ${grade}`);
      
      const { data: absenceRows, error } = await supabase
        .rpc('pending_absence_approvals_by_grade', {
          p_grade: grade.trim()
        });

      console.log(`[Student API] Query result:`, { absenceRows, error });

      if (error) {
        console.error("Pending absence approvals error:", error);
        throw APIError.internal(`Failed to get pending absence approvals: ${error.message}`);
      }

      const requests: AbsenceRequest[] = (absenceRows || []).map((row: any) => {
        console.log('[Student API] Mapping row:', row);
        return {
          absencercdid: row.absencercdid,
          studentid: row.studentid,
          studentname: row.studentname || '',
          grade: row.grade || '',
          absencedate: row.absencedate || '',
          fullday: row.fullday || false,
          absencestarttm: row.absencestarttm || row.absencestarttime || undefined,
          absenceendtm: row.absenceendtm || row.absenceendtime || undefined,
          approvalstatus: row.approvalstatus || '',
          requester_note: row.requester_note || undefined,
          createdon: row.createdon || '',
        };
      });

      console.log(`[Student API] Found ${requests.length} pending absence requests`);
      return {
        requests,
        grade: grade.trim(),
        totalCount: requests.length
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error getting pending absence approvals:", error);
      throw APIError.internal("Failed to get pending absence approvals");
    }
  }
);
