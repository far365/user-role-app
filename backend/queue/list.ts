import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, ListQueuesResponse } from "./types";

// Retrieves all queues ordered by creation date.
export const list = api<void, ListQueuesResponse>(
  { expose: true, method: "GET", path: "/queue/list" },
  async () => {
    try {
      console.log("[Queue API] Fetching all queues");
      
      const { data: queueRows, error } = await supabase
        .from('queuemasterrcd')
        .select('*')
        .order('queuestarttime', { ascending: false });

      console.log("[Queue API] List queues result:", { count: queueRows?.length || 0, error });

      if (error) {
        console.error("[Queue API] Error fetching queues:", error);
        throw new Error(`Failed to fetch queues: ${error.message}`);
      }

      const queues: Queue[] = (queueRows || []).map(row => ({
        queueId: row.queueid,
        queueStartTime: row.queuestarttime ? new Date(row.queuestarttime) : null,
        queueStartedByUsername: row.queuestartedbyusername,
        queueEndTime: row.queueendtime ? new Date(row.queueendtime) : null,
        queueClosedByUsername: row.queueclosedbyusername,
        queueMasterStatus: row.queuemasterstatus,
        lastUpdatedTTM: row.lastupdatedttm ? new Date(row.lastupdatedttm) : null,
        archivedDTTM: row.archiveddttm ? new Date(row.archiveddttm) : null,
      }));

      console.log("[Queue API] Successfully fetched queues:", queues.length);
      return { queues };

    } catch (error) {
      console.error("[Queue API] Unexpected error fetching queues:", error);
      throw new Error("Failed to fetch queues");
    }
  }
);
