import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface GetQueueHistoryRequest {
  p_start_date: string;
  p_end_date: string;
  p_grade?: string;
  p_parentid?: string;
  p_studentid?: string;
}

export interface QueueHistoryRecord {
  queueid: string;
  classbuilding: string;
  grade?: string;
  dismissal_queue_status?: string;
  parentid?: string;
  studentid?: string;
  studentname?: string;
  parentname?: string;
  alternatename?: string;
  qrscannedat?: Date;
  addtoqueumethod?: string;
  qrscannedat_building?: string;
  dismissedat?: Date;
  dismissedbyname?: string;
  dismissstatus?: string;
  studentselfdismiss?: boolean;
  dismississue?: string;
  pickupconfirmeddttm?: Date;
  pickupconfirmedbyname?: string;
  pickupissue?: string;
  arrival_status?: string;
}

export interface GetQueueHistoryResponse {
  records: QueueHistoryRecord[];
}

export const getHistorybyGradeParentStudent = api<GetQueueHistoryRequest, GetQueueHistoryResponse>(
  { expose: true, method: "GET", path: "/queue/history" },
  async (req) => {
    const hasGrade = req.p_grade !== undefined && req.p_grade !== null && req.p_grade !== "";
    const hasParentId = req.p_parentid !== undefined && req.p_parentid !== null && req.p_parentid !== "";
    const hasStudentId = req.p_studentid !== undefined && req.p_studentid !== null && req.p_studentid !== "";
    
    if (!hasGrade && !hasParentId && !hasStudentId) {
      throw APIError.invalidArgument("At least one of p_grade, p_parentid, or p_studentid must be provided");
    }

    try {
      const { data, error } = await supabase.rpc("get_queue_history_by_grade_parentid_studentid", {
        p_grade: req.p_grade || null,
        p_parentid: req.p_parentid || null,
        p_studentid: req.p_studentid || null,
        p_queue_start_dt: req.p_start_date,
        p_queue_end_dt: req.p_end_date,
      });

      if (error) {
        console.error("[Queue History API] Error fetching queue history:", error);
        throw APIError.internal(`Failed to fetch queue history: ${error.message || error}`);
      }

      const records: QueueHistoryRecord[] = (data || []).map((row: any) => ({
        queueid: row.queueid,
        classbuilding: row.classbuilding,
        grade: row.grade,
        dismissal_queue_status: row.dismissal_queue_status,
        parentid: row.parentid,
        studentid: row.studentid,
        studentname: row.studentname,
        parentname: row.parentname,
        alternatename: row.alternatename,
        qrscannedat: row.qrscannedat ? new Date(row.qrscannedat) : undefined,
        addtoqueumethod: row.addtoqueumethod,
        qrscannedat_building: row.qrscannedat_building,
        dismissedat: row.dismissedat ? new Date(row.dismissedat) : undefined,
        dismissedbyname: row.dismissedbyname,
        dismissstatus: row.dismissstatus,
        studentselfdismiss: row.studentselfdismiss,
        dismississue: row.dismississue,
        pickupconfirmeddttm: row.pickupconfirmeddttm ? new Date(row.pickupconfirmeddttm) : undefined,
        pickupconfirmedbyname: row.pickupconfirmedbyname,
        pickupissue: row.pickupissue,
        arrival_status: row.arrival_status,
      }));

      return { records };

    } catch (error: any) {
      console.error("[Queue History API] Unexpected error:", error);
      throw APIError.internal(`Unexpected error fetching queue history: ${error.message || error}`);
    }
  }
);
