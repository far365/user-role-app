import { api, APIError, Query } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface PendingAndApprovedAbsencesByStudentRequest {
  studentid: Query<string>;
}

export interface AbsenceRecord {
  absencercdid: number;
  absencedate: string;
  fullday: boolean;
  absencestarttm?: string;
  absenceendtm?: string;
  approvalstatus: string;
  absencereason?: string;
  requester_note?: string;
  approver_note?: string;
  createdon: string;
  updatedon?: string;
}

export interface PendingAndApprovedAbsencesByStudentResponse {
  absences: AbsenceRecord[];
  studentid: string;
  totalCount: number;
}

export const pendingAndApprovedAbsencesByStudent = api<PendingAndApprovedAbsencesByStudentRequest, PendingAndApprovedAbsencesByStudentResponse>(
  { expose: true, method: "GET", path: "/student/pending-and-approved-absences-by-student" },
  async ({ studentid }) => {
    if (!studentid || !studentid.trim()) {
      throw APIError.invalidArgument("Student ID is required");
    }

    try {
      console.log(`[Student API] Getting pending and approved absences for student: ${studentid}`);
      
      const { data: absenceRows, error } = await supabase
        .rpc('pending_and_approved_absences_by_student', {
          p_studentid: studentid.trim()
        });

      console.log(`[Student API] Query result:`, { absenceRows, error });

      if (error) {
        console.error("Pending and approved absences error:", error);
        throw APIError.internal(`Failed to get absences: ${error.message}`);
      }

      const absences: AbsenceRecord[] = (absenceRows || []).map((row: any) => {
        console.log('[Student API] Mapping absence row:', row);
        return {
          absencercdid: row.absencercdid,
          absencedate: row.absencedate || '',
          fullday: row.fullday || false,
          absencestarttm: row.absencestarttm || row.absencestarttime || undefined,
          absenceendtm: row.absenceendtm || row.absenceendtime || undefined,
          approvalstatus: row.approvalstatus || '',
          absencereason: row.absencereason || undefined,
          requester_note: row.requester_note || undefined,
          approver_note: row.approver_note || undefined,
          createdon: row.createdon || '',
          updatedon: row.updatedon || undefined,
        };
      });

      console.log(`[Student API] Found ${absences.length} absence records`);
      return {
        absences,
        studentid: studentid.trim(),
        totalCount: absences.length
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error getting absences:", error);
      throw APIError.internal("Failed to get absences");
    }
  }
);
