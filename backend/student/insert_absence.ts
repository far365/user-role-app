import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface InsertAbsenceRequest {
  studentid: number;
  absencetype: 'ApprovedAbsence' | 'UnapprovedAbsence' | 'ExcusedAbsence' | 'UnexcusedAbsence';
  absencedate: string;
  fullday: boolean;
  absencestarttime?: string;
  absenceendtime?: string;
  createdbyuserid: string;
  absencereason: string;
  approvalstatus: 'Pending' | 'Approved' | 'Rejected';
  approvedon?: string;
  approvedbyuserid?: string;
  requester_note?: string;
  approver_note?: string;
}

export interface InsertAbsenceResponse {
  status: 'Success' | 'Failed';
  message?: string;
}

export const insertAbsence = api<InsertAbsenceRequest, InsertAbsenceResponse>(
  { expose: true, method: "POST", path: "/student/insert-absence" },
  async (req) => {
    if (!req.studentid) {
      throw APIError.invalidArgument("Student ID is required");
    }

    if (!req.absencedate) {
      throw APIError.invalidArgument("Absence date is required");
    }

    if (!req.createdbyuserid) {
      throw APIError.invalidArgument("Created by user ID is required");
    }

    try {
      console.log(`[Student API] Inserting absence record for student: ${req.studentid}`);
      
      const { data, error } = await supabase.rpc('insert_absence_rcd', {
        p_studentid: req.studentid,
        p_absencetype: req.absencetype,
        p_absencedate: req.absencedate,
        p_fullday: req.fullday,
        p_absencestarttime: req.absencestarttime || null,
        p_absenceendtime: req.absenceendtime || null,
        p_createdbyuserid: req.createdbyuserid,
        p_absencereason: req.absencereason,
        p_approvalstatus: req.approvalstatus,
        p_approvedon: req.approvedon || null,
        p_approvedbyuserid: req.approvedbyuserid || null,
        p_requester_note: req.requester_note || null,
        p_approver_note: req.approver_note || null
      });

      if (error) {
        console.error("Insert absence record error:", error);
        return {
          status: 'Failed',
          message: error.message
        };
      }

      console.log(`[Student API] Successfully inserted absence record for student: ${req.studentid}`);
      return {
        status: 'Success'
      };

    } catch (error) {
      console.error("Unexpected error inserting absence record:", error);
      return {
        status: 'Failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);
