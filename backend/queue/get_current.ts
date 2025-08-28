import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, GetCurrentQueueResponse } from "./types";

// Retrieves the currently open queue.
export const getCurrentQueue = api<void, GetCurrentQueueResponse>(
  { expose: true, method: "GET", path: "/queue/current" },
  async () => {
    try {
      console.log("[Queue API] Getting current open queue");
      
      const { data: queueRow, error } = await supabase
        .from('queuemasterrcd')
        .select('*')
        .eq('queuemasterstatus', 'Open')
        .single();

      console.log("[Queue API] Current queue query result:", { queueRow, error });

      if (error) {
        if (error.code === 'PGRST116') {
          console.log("[Queue API] No open queue found");
          return { queue: null };
        }
        console.error("[Queue API] Error fetching current queue:", error);
        return { queue: null };
      }

      if (!queueRow) {
        console.log("[Queue API] No open queue found");
        return { queue: null };
      }

      const queue: Queue = {
        queueId: queueRow.queueid,
        queueStartTime: queueRow.queuestarttime ? new Date(queueRow.queuestarttime) : null,
        queueStartedByUsername: queueRow.queuestartedbyusername,
        queueEndTime: queueRow.queueendtime ? new Date(queueRow.queueendtime) : null,
        queueClosedByUsername: queueRow.queueclosedbyusername,
        queueMasterStatus: queueRow.queuemasterstatus,
        lastUpdatedTTM: queueRow.lastupdatedttm ? new Date(queueRow.lastupdatedttm) : null,
        archivedDTTM: queueRow.archiveddttm ? new Date(queueRow.archiveddttm) : null,
      };

      console.log("[Queue API] Found current open queue:", queue);
      return { queue };

    } catch (error) {
      console.error("[Queue API] Unexpected error getting current queue:", error);
      return { queue: null };
    }
  }
);
