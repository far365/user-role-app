import { api, APIError, Query } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface GetQueueListByGradeRequest {
  grade: Query<string>;
}

export interface DismissalQueueRecord {
  queueId: string;
  classBuilding: string;
  grade: string;
  dismissalQueueStatus: string;
  parentId?: string;
  studentId?: string;
  studentName?: string;
  parentName?: string;
  alternateName?: string;
  qrScannedAt?: Date;
  addToQueueMethod: string;
  qrScannedAtBuilding?: string;
  dismissedAt?: Date;
  dismissedByName?: string;
  dismissStatus?: string;
  studentSelfDismiss?: boolean;
  dismissIssue?: string;
  pickupConfirmedDTTM?: Date;
  pickupConfirmedByName?: string;
  pickupIssue?: string;
}

export interface GetQueueListByGradeResponse {
  records: DismissalQueueRecord[];
  grade: string;
  queueId: string | null;
  totalCount: number;
}

// Retrieves all dismissal queue records for a specific grade in the currently open queue.
export const getQueueListByGrade = api<GetQueueListByGradeRequest, GetQueueListByGradeResponse>(
  { expose: true, method: "GET", path: "/queue/list-by-grade" },
  async ({ grade }) => {
    if (!grade || !grade.trim()) {
      throw APIError.invalidArgument("Grade is required");
    }

    try {
      console.log(`[Queue API] Getting dismissal queue list for grade: ${grade}`);
      
      // Execute the SQL query to get dismissal queue records for the specified grade
      // from the currently open queue
      const { data: dismissalRecords, error } = await supabase
        .rpc('execute_sql', {
          sql_query: `
            SELECT dq.*
            FROM public.dismissalqueuercd AS dq
            WHERE dq.queueid = (
                SELECT qm.queueid::bigint
                FROM public.queuemasterrcd qm
                WHERE qm.queuemasterstatus = 'Open'
            )
            AND dq.grade = $1
            ORDER BY dq.studentname
          `,
          params: [grade.trim()]
        })
        .then(result => result)
        .catch(() => ({ data: null, error: 'Raw SQL execution not available' }));

      if (dismissalRecords) {
        console.log(`[Queue API] Raw SQL query successful, found ${dismissalRecords.length} records`);
        
        // Get the queue ID for response
        const { data: openQueue } = await supabase
          .from('queuemasterrcd')
          .select('queueid')
          .eq('queuemasterstatus', 'Open')
          .single();

        const records: DismissalQueueRecord[] = dismissalRecords.map((row: any) => ({
          queueId: String(row.queueid || ''),
          classBuilding: row.classbuilding || '',
          grade: row.grade || '',
          dismissalQueueStatus: row.dismissalqueuestatus || '',
          parentId: row.parentid || undefined,
          studentId: row.studentid || undefined,
          studentName: row.studentname || undefined,
          parentName: row.parentname || undefined,
          alternateName: row.alternatename || undefined,
          qrScannedAt: row.qrscanedat ? new Date(row.qrscanedat) : undefined,
          addToQueueMethod: row.addtoqueuemethod || '',
          qrScannedAtBuilding: row.qrscannedatbuilding || undefined,
          dismissedAt: row.dismissedat ? new Date(row.dismissedat) : undefined,
          dismissedByName: row.dismissedbyname || undefined,
          dismissStatus: row.dismissstatus || undefined,
          studentSelfDismiss: row.studntselfdismiss || false,
          dismissIssue: row.dismississue || undefined,
          pickupConfirmedDTTM: row.pickupconfirmeddttm ? new Date(row.pickupconfirmeddttm) : undefined,
          pickupConfirmedByName: row.pickupconfirmedbyname || undefined,
          pickupIssue: row.pickuissue || undefined,
        }));

        return {
          records,
          grade: grade.trim(),
          queueId: openQueue?.queueid || null,
          totalCount: records.length
        };
      }

      // Fallback to regular Supabase queries if raw SQL is not available
      console.log(`[Queue API] Raw SQL not available, using fallback method`);
      
      // First, get the currently open queue
      const { data: openQueue, error: queueError } = await supabase
        .from('queuemasterrcd')
        .select('queueid')
        .eq('queuemasterstatus', 'Open')
        .single();

      console.log(`[Queue API] Open queue query result:`, { openQueue, queueError });

      if (queueError) {
        if (queueError.code === 'PGRST116') {
          console.log(`[Queue API] No open queue found`);
          return {
            records: [],
            grade: grade.trim(),
            queueId: null,
            totalCount: 0
          };
        }
        console.error(`[Queue API] Error finding open queue:`, queueError);
        throw APIError.internal(`Failed to find open queue: ${queueError.message}`);
      }

      if (!openQueue) {
        console.log(`[Queue API] No open queue found`);
        return {
          records: [],
          grade: grade.trim(),
          queueId: null,
          totalCount: 0
        };
      }

      console.log(`[Queue API] Found open queue: ${openQueue.queueid}`);

      // Now get the dismissal queue records for this grade in the open queue
      const { data: dismissalRows, error: dismissalError } = await supabase
        .from('dismissalqueuercd')
        .select('*')
        .eq('queueid', openQueue.queueid)
        .eq('grade', grade.trim())
        .order('studentname');

      console.log(`[Queue API] Dismissal queue query result:`, { dismissalRows, dismissalError });

      if (dismissalError) {
        console.error(`[Queue API] Error getting dismissal queue records:`, dismissalError);
        throw APIError.internal(`Failed to get dismissal queue records: ${dismissalError.message}`);
      }

      if (!dismissalRows || dismissalRows.length === 0) {
        console.log(`[Queue API] No dismissal queue records found for grade ${grade} in queue ${openQueue.queueid}`);
        return {
          records: [],
          grade: grade.trim(),
          queueId: openQueue.queueid,
          totalCount: 0
        };
      }

      // Map the database records to our interface
      const records: DismissalQueueRecord[] = dismissalRows.map(row => ({
        queueId: String(row.queueid || ''),
        classBuilding: row.classbuilding || '',
        grade: row.grade || '',
        dismissalQueueStatus: row.dismissalqueuestatus || '',
        parentId: row.parentid || undefined,
        studentId: row.studentid || undefined,
        studentName: row.studentname || undefined,
        parentName: row.parentname || undefined,
        alternateName: row.alternatename || undefined,
        qrScannedAt: row.qrscanedat ? new Date(row.qrscanedat) : undefined,
        addToQueueMethod: row.addtoqueuemethod || '',
        qrScannedAtBuilding: row.qrscannedatbuilding || undefined,
        dismissedAt: row.dismissedat ? new Date(row.dismissedat) : undefined,
        dismissedByName: row.dismissedbyname || undefined,
        dismissStatus: row.dismissstatus || undefined,
        studentSelfDismiss: row.studntselfdismiss || false,
        dismissIssue: row.dismississue || undefined,
        pickupConfirmedDTTM: row.pickupconfirmeddttm ? new Date(row.pickupconfirmeddttm) : undefined,
        pickupConfirmedByName: row.pickupconfirmedbyname || undefined,
        pickupIssue: row.pickuissue || undefined,
      }));

      console.log(`[Queue API] Successfully retrieved ${records.length} dismissal queue records for grade ${grade}`);

      return {
        records,
        grade: grade.trim(),
        queueId: openQueue.queueid,
        totalCount: records.length
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Queue API] Unexpected error getting queue list by grade:", error);
      throw APIError.internal("Failed to get queue list by grade");
    }
  }
);
