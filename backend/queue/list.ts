import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, ListQueuesResponse } from "./types";

// Retrieves all queues ordered by creation date.
export const list = api<void, ListQueuesResponse>(
  { expose: true, method: "GET", path: "/queue/list" },
  async () => {
    try {
      console.log("[Queue API] Fetching all queues");
      
      // Test Supabase connection first
      try {
        const { data: connectionTest, error: connectionError } = await supabase
          .from('usersrcd')
          .select('count')
          .limit(1);
        
        if (connectionError) {
          console.error("[Queue API] Supabase connection failed:", connectionError);
          throw new Error(`Database connection failed: ${connectionError.message}`);
        }
      } catch (connErr) {
        console.error("[Queue API] Supabase connection test failed:", connErr);
        throw new Error("Database connection failed");
      }

      // Test if queuemasterrcd table is accessible
      try {
        const { error: tableTestError } = await supabase
          .from('queuemasterrcd')
          .select('*')
          .limit(0);
        
        if (tableTestError) {
          console.error("[Queue API] Table access error:", tableTestError);
          if (tableTestError.code === 'PGRST116') {
            throw new Error(`Table 'queuemasterrcd' does not exist: ${tableTestError.message}`);
          } else {
            throw new Error(`Cannot access queuemasterrcd table: ${tableTestError.message}`);
          }
        }
      } catch (tableErr) {
        console.error("[Queue API] Table access failed:", tableErr);
        if (tableErr instanceof Error) {
          throw tableErr;
        }
        throw new Error("Cannot access queuemasterrcd table");
      }
      
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
