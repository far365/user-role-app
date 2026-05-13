import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, CloseQueueRequest, CloseQueueResponse } from "./types";

export const close = api<CloseQueueRequest, CloseQueueResponse>(
  { expose: true, method: "PUT", path: "/queue/close" },
  async ({ queueClosedByUsername }) => {
    if (!queueClosedByUsername || !queueClosedByUsername.trim()) {
      throw APIError.invalidArgument("Username is required to close a queue");
    }

    try {
      const { data: functionResult, error: functionError } = await supabase
        .rpc('close_currently_open_queue', { p_userid: queueClosedByUsername.trim() });

      if (functionError) {
        if (functionError.message.includes('No open queue found')) {
          throw APIError.notFound("No open queue found to close");
        }
        throw APIError.internal(`Failed to close queue: ${functionError.message}`);
      }

      if (!functionResult) {
        throw APIError.internal("No result returned from close queue function");
      }

      const closedQueueData = functionResult;

      const queue: Queue = {
        queueId: closedQueueData.queueid || closedQueueData.queue_id || '',
        queueStartTime: closedQueueData.queuestarttime || closedQueueData.queue_start_time
          ? new Date(closedQueueData.queuestarttime || closedQueueData.queue_start_time)
          : null,
        queueStartedByUsername: closedQueueData.queuestartedbyusername || closedQueueData.queue_started_by_username || null,
        queueEndTime: closedQueueData.queueendtime || closedQueueData.queue_end_time
          ? new Date(closedQueueData.queueendtime || closedQueueData.queue_end_time)
          : null,
        queueClosedByUsername: closedQueueData.queueclosedbyusername || closedQueueData.queue_closed_by_username || null,
        queueMasterStatus: closedQueueData.queuemasterstatus || closedQueueData.queue_master_status || null,
        lastUpdatedTTM: closedQueueData.lastupdatedttm || closedQueueData.last_updated_ttm
          ? new Date(closedQueueData.lastupdatedttm || closedQueueData.last_updated_ttm)
          : null,
        archivedDTTM: closedQueueData.archiveddttm || closedQueueData.archived_dttm
          ? new Date(closedQueueData.archiveddttm || closedQueueData.archived_dttm)
          : null,
      };

      return { queue };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to close queue");
    }
  }
);
