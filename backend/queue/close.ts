import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, CloseQueueRequest, CloseQueueResponse } from "./types";

// Closes the currently open queue.
export const close = api<CloseQueueRequest, CloseQueueResponse>(
  { expose: true, method: "PUT", path: "/queue/close" },
  async ({ queueClosedByUsername }) => {
    if (!queueClosedByUsername || !queueClosedByUsername.trim()) {
      throw APIError.invalidArgument("Username is required to close a queue");
    }

    try {
      console.log("[Queue API] Closing open queue for user:", queueClosedByUsername);
      
      // Find the currently open queue
      const { data: openQueue, error: findError } = await supabase
        .from('queuemasterrcd')
        .select('*')
        .eq('queuemasterstatus', 'Open')
        .single();

      console.log("[Queue API] Open queue search result:", { openQueue, findError });

      if (findError) {
        if (findError.code === 'PGRST116') {
          throw APIError.notFound("No open queue found to close");
        }
        console.error("[Queue API] Error finding open queue:", findError);
        throw APIError.internal(`Failed to find open queue: ${findError.message}`);
      }

      if (!openQueue) {
        throw APIError.notFound("No open queue found to close");
      }

      // Close the queue
      const currentTime = new Date().toISOString();
      const { data: closedQueue, error: closeError } = await supabase
        .from('queuemasterrcd')
        .update({
          queueendtime: currentTime,
          queueclosedbyusername: queueClosedByUsername.trim(),
          queuemasterstatus: 'Closed',
          lastupdatedttm: currentTime
        })
        .eq('queueid', openQueue.queueid)
        .select('*')
        .single();

      console.log("[Queue API] Close queue result:", { closedQueue, closeError });

      if (closeError) {
        console.error("[Queue API] Error closing queue:", closeError);
        throw APIError.internal(`Failed to close queue: ${closeError.message}`);
      }

      if (!closedQueue) {
        throw APIError.internal("Failed to retrieve closed queue");
      }

      const queue: Queue = {
        queueId: closedQueue.queueid,
        queueStartTime: closedQueue.queuestarttime ? new Date(closedQueue.queuestarttime) : null,
        queueStartedByUsername: closedQueue.queuestartedbyusername,
        queueEndTime: closedQueue.queueendtime ? new Date(closedQueue.queueendtime) : null,
        queueClosedByUsername: closedQueue.queueclosedbyusername,
        queueMasterStatus: closedQueue.queuemasterstatus,
        lastUpdatedTTM: closedQueue.lastupdatedttm ? new Date(closedQueue.lastupdatedttm) : null,
        archivedDTTM: closedQueue.archiveddttm ? new Date(closedQueue.archiveddttm) : null,
      };

      console.log("[Queue API] Successfully closed queue:", queue);
      return { queue };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Queue API] Unexpected error closing queue:", error);
      throw APIError.internal("Failed to close queue");
    }
  }
);
