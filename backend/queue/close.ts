import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, CloseQueueRequest, CloseQueueResponse } from "./types";

// Closes the currently open queue and updates dismissal queue statuses.
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

      // Update dismissal queue records - change 'Standby' to 'Unknown'
      console.log("[Queue API] === UPDATING DISMISSAL QUEUE ON CLOSE ===");
      console.log(`[Queue API] Updating dismissal queue records for queue ${openQueue.queueid}...`);
      
      try {
        // Update records where queueid matches the open queue ID
        const { data: updatedDismissalRecords, error: dismissalUpdateError } = await supabase
          .from('dismissalqueuercd')
          .update({ dismissalqueuestatus: 'Unknown' })
          .eq('queueid', openQueue.queueid)
          .eq('dismissalqueuestatus', 'Standby')
          .select('*');

        if (dismissalUpdateError) {
          console.error("[Queue API] Error updating dismissal queue records:", dismissalUpdateError);
          // Don't fail the queue closure, but log the error
          console.error("[Queue API] Warning: Queue will be closed but dismissal queue update failed");
        } else {
          console.log(`[Queue API] Successfully updated ${updatedDismissalRecords?.length || 0} dismissal queue records from 'Standby' to 'Unknown'`);
        }
      } catch (dismissalError) {
        console.error("[Queue API] Error during dismissal queue update:", dismissalError);
        // Don't fail the queue closure, just log the error
        console.error("[Queue API] Warning: Queue will be closed but dismissal queue update failed");
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
