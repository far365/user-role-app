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
      
      // First try without ordering to see if we can get the data
      console.log("[Queue API] Attempting to fetch all records without ordering...");
      const { data: queueRowsNoOrder, error: noOrderError } = await supabase
        .from('queuemasterrcd')
        .select('*');

      console.log("[Queue API] No-order query result:", { count: queueRowsNoOrder?.length || 0, error: noOrderError });

      if (noOrderError) {
        console.error("[Queue API] Error fetching queues without order:", noOrderError);
        throw new Error(`Failed to fetch queues: ${noOrderError.message}`);
      }

      // If we got data without ordering, try with ordering
      let queueRows = queueRowsNoOrder;
      if (queueRowsNoOrder && queueRowsNoOrder.length > 0) {
        console.log("[Queue API] Data found, now trying with ordering...");
        
        // Try ordering by queueid first (since it's YYYYMMDD format, it should order chronologically)
        const { data: orderedRows, error: orderError } = await supabase
          .from('queuemasterrcd')
          .select('*')
          .order('queueid', { ascending: false });

        if (orderError) {
          console.log("[Queue API] Ordering by queueid failed, trying queuestarttime:", orderError);
          
          // Fallback to ordering by queuestarttime
          const { data: timeOrderedRows, error: timeOrderError } = await supabase
            .from('queuemasterrcd')
            .select('*')
            .order('queuestarttime', { ascending: false });

          if (timeOrderError) {
            console.log("[Queue API] Ordering by queuestarttime failed, using unordered data:", timeOrderError);
            // Use the unordered data we got earlier
            queueRows = queueRowsNoOrder;
          } else {
            queueRows = timeOrderedRows;
          }
        } else {
          queueRows = orderedRows;
        }
      }

      console.log("[Queue API] Final query result:", { count: queueRows?.length || 0 });

      if (!queueRows) {
        console.log("[Queue API] No queue data returned");
        return { queues: [] };
      }

      const queues: Queue[] = queueRows.map(row => {
        console.log("[Queue API] Processing queue row:", row);
        return {
          queueId: row.queueid,
          queueStartTime: row.queuestarttime ? new Date(row.queuestarttime) : null,
          queueStartedByUsername: row.queuestartedbyusername,
          queueEndTime: row.queueendtime ? new Date(row.queueendtime) : null,
          queueClosedByUsername: row.queueclosedbyusername,
          queueMasterStatus: row.queuemasterstatus,
          lastUpdatedTTM: row.lastupdatedttm ? new Date(row.lastupdatedttm) : null,
          archivedDTTM: row.archiveddttm ? new Date(row.archiveddttm) : null,
        };
      });

      console.log("[Queue API] Successfully fetched and mapped queues:", queues.length);
      console.log("[Queue API] Queue details:", queues);
      return { queues };

    } catch (error) {
      console.error("[Queue API] Unexpected error fetching queues:", error);
      throw new Error("Failed to fetch queues");
    }
  }
);
