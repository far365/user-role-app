import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, ListQueuesResponse } from "./types";

// Retrieves all queues ordered by creation date.
export const list = api<void, ListQueuesResponse>(
  { expose: true, method: "GET", path: "/queue/list" },
  async () => {
    try {
      console.log("[Queue API] Fetching all queues");
      
      // Fetch all queue records from the database
      const { data: queueRows, error } = await supabase
        .from('queuemasterrcd')
        .select('*')
        .order('queueid', { ascending: false }); // Order by queue ID descending (newest first)

      if (error) {
        console.error("[Queue API] Error fetching queues:", error);
        throw new Error(`Failed to fetch queues: ${error.message}`);
      }

      if (!queueRows) {
        console.log("[Queue API] No queue data returned");
        return { queues: [] };
      }

      console.log(`[Queue API] Successfully fetched ${queueRows.length} queues`);

      // Map the database fields to our Queue interface
      const queues: Queue[] = queueRows.map((row) => ({
        queueId: row.queueid || '',
        queueStartTime: row.queuestarttime ? new Date(row.queuestarttime) : null,
        queueStartedByUsername: row.queuestartedbyusername || null,
        queueEndTime: row.queueendtime ? new Date(row.queueendtime) : null,
        queueClosedByUsername: row.queueclosedbyusername || null,
        queueMasterStatus: row.queuemasterstatus || null,
        lastUpdatedTTM: row.lastupdatedttm ? new Date(row.lastupdatedttm) : null,
        archivedDTTM: row.archiveddttm ? new Date(row.archiveddttm) : null,
      }));

      console.log(`[Queue API] Returning ${queues.length} mapped queues`);
      return { queues };

    } catch (error) {
      console.error("[Queue API] Error in queue list:", error);
      
      // Return empty array instead of throwing to prevent frontend crashes
      return { queues: [] };
    }
  }
);
