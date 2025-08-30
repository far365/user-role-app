import { api, APIError, Query } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface GetQueueCountByGradeRequest {
  grade: Query<string>;
}

export interface QueueStatusCount {
  dismissalQueueStatus: string;
  count: number;
}

export interface GetQueueCountByGradeResponse {
  grade: string;
  queueId: string | null;
  statusCounts: QueueStatusCount[];
  totalCount: number;
}

// Retrieves dismissal queue status counts for a specific grade in the currently open queue.
export const getQueueCountByGrade = api<GetQueueCountByGradeRequest, GetQueueCountByGradeResponse>(
  { expose: true, method: "GET", path: "/queue/count-by-grade" },
  async ({ grade }) => {
    if (!grade || !grade.trim()) {
      throw APIError.invalidArgument("Grade is required");
    }

    try {
      console.log(`[Queue API] Getting queue count for grade: ${grade}`);
      
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
            grade: grade.trim(),
            queueId: null,
            statusCounts: [],
            totalCount: 0
          };
        }
        console.error(`[Queue API] Error finding open queue:`, queueError);
        throw APIError.internal(`Failed to find open queue: ${queueError.message}`);
      }

      if (!openQueue) {
        console.log(`[Queue API] No open queue found`);
        return {
          grade: grade.trim(),
          queueId: null,
          statusCounts: [],
          totalCount: 0
        };
      }

      console.log(`[Queue API] Found open queue: ${openQueue.queueid}`);

      // Now get the dismissal queue counts for this grade in the open queue
      const { data: statusCounts, error: countError } = await supabase
        .from('dismissalqueuercd')
        .select('dismissalqueuestatus')
        .eq('queueid', openQueue.queueid)
        .eq('grade', grade.trim());

      console.log(`[Queue API] Dismissal queue query result:`, { statusCounts, countError });

      if (countError) {
        console.error(`[Queue API] Error getting dismissal queue counts:`, countError);
        throw APIError.internal(`Failed to get dismissal queue counts: ${countError.message}`);
      }

      if (!statusCounts || statusCounts.length === 0) {
        console.log(`[Queue API] No dismissal queue records found for grade ${grade} in queue ${openQueue.queueid}`);
        return {
          grade: grade.trim(),
          queueId: openQueue.queueid,
          statusCounts: [],
          totalCount: 0
        };
      }

      // Count the statuses manually since Supabase doesn't support GROUP BY in the client
      const statusCountMap = new Map<string, number>();
      statusCounts.forEach(record => {
        const status = record.dismissalqueuestatus || 'Unknown';
        statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
      });

      // Convert to array format
      const statusCountsArray: QueueStatusCount[] = Array.from(statusCountMap.entries()).map(([status, count]) => ({
        dismissalQueueStatus: status,
        count: count
      }));

      // Sort by status name for consistency
      statusCountsArray.sort((a, b) => a.dismissalQueueStatus.localeCompare(b.dismissalQueueStatus));

      const totalCount = statusCounts.length;

      console.log(`[Queue API] Successfully calculated counts for grade ${grade}:`, {
        queueId: openQueue.queueid,
        statusCounts: statusCountsArray,
        totalCount
      });

      return {
        grade: grade.trim(),
        queueId: openQueue.queueid,
        statusCounts: statusCountsArray,
        totalCount
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Queue API] Unexpected error getting queue count by grade:", error);
      throw APIError.internal("Failed to get queue count by grade");
    }
  }
);
