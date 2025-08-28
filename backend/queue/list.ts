import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, ListQueuesResponse } from "./types";

// Retrieves all queues ordered by creation date.
export const list = api<void, ListQueuesResponse>(
  { expose: true, method: "GET", path: "/queue/list" },
  async () => {
    try {
      console.log("[Queue API] === ENHANCED QUEUE LIST DEBUG START ===");
      
      // Test Supabase connection first
      console.log("[Queue API] Testing Supabase connection...");
      try {
        const { data: connectionTest, error: connectionError } = await supabase
          .from('usersrcd')
          .select('count')
          .limit(1);
        
        if (connectionError) {
          console.error("[Queue API] Supabase connection failed:", connectionError);
          throw new Error(`Database connection failed: ${connectionError.message}`);
        }
        console.log("[Queue API] Supabase connection: OK");
      } catch (connErr) {
        console.error("[Queue API] Supabase connection test failed:", connErr);
        throw new Error("Database connection failed");
      }

      // Test if queuemasterrcd table is accessible
      console.log("[Queue API] Testing queuemasterrcd table access...");
      try {
        const { error: tableTestError } = await supabase
          .from('queuemasterrcd')
          .select('*')
          .limit(0);
        
        if (tableTestError) {
          console.error("[Queue API] Table access error:", tableTestError);
          console.error("[Queue API] Error code:", tableTestError.code);
          console.error("[Queue API] Error details:", tableTestError.details);
          console.error("[Queue API] Error hint:", tableTestError.hint);
          
          if (tableTestError.code === 'PGRST116') {
            throw new Error(`Table 'queuemasterrcd' does not exist: ${tableTestError.message}`);
          } else if (tableTestError.code === '42501') {
            throw new Error(`Permission denied accessing 'queuemasterrcd' table: ${tableTestError.message}`);
          } else {
            throw new Error(`Cannot access queuemasterrcd table: ${tableTestError.message}`);
          }
        }
        console.log("[Queue API] Table access: OK");
      } catch (tableErr) {
        console.error("[Queue API] Table access failed:", tableErr);
        if (tableErr instanceof Error) {
          throw tableErr;
        }
        throw new Error("Cannot access queuemasterrcd table");
      }
      
      // Get total count first to see if there are any records
      console.log("[Queue API] Checking total record count...");
      const { count: totalCount, error: countError } = await supabase
        .from('queuemasterrcd')
        .select('*', { count: 'exact', head: true });

      console.log("[Queue API] Total records in queuemasterrcd:", totalCount);
      if (countError) {
        console.error("[Queue API] Count error:", countError);
      }

      if (totalCount === 0) {
        console.log("[Queue API] Table is empty, returning empty array");
        return { queues: [] };
      }

      // Try to get a sample record to see the structure
      console.log("[Queue API] Fetching sample record to check structure...");
      const { data: sampleRecord, error: sampleError } = await supabase
        .from('queuemasterrcd')
        .select('*')
        .limit(1)
        .single();

      if (sampleError) {
        console.error("[Queue API] Sample record error:", sampleError);
      } else {
        console.log("[Queue API] Sample record structure:", Object.keys(sampleRecord || {}));
        console.log("[Queue API] Sample record data:", sampleRecord);
      }

      // Try multiple approaches to fetch all records
      console.log("[Queue API] Attempting to fetch all records with multiple approaches...");
      
      let queueRows = null;
      let finalError = null;

      // Approach 1: Simple select all
      console.log("[Queue API] Approach 1: Simple select all");
      try {
        const { data: approach1Data, error: approach1Error } = await supabase
          .from('queuemasterrcd')
          .select('*');

        console.log("[Queue API] Approach 1 result:", { 
          count: approach1Data?.length || 0, 
          error: approach1Error?.message || null 
        });

        if (!approach1Error && approach1Data) {
          queueRows = approach1Data;
          console.log("[Queue API] Approach 1 succeeded");
        } else {
          finalError = approach1Error;
        }
      } catch (err) {
        console.error("[Queue API] Approach 1 exception:", err);
        finalError = err;
      }

      // Approach 2: Select with explicit columns (if approach 1 failed)
      if (!queueRows && sampleRecord) {
        console.log("[Queue API] Approach 2: Select with explicit columns");
        try {
          const columns = Object.keys(sampleRecord).join(', ');
          console.log("[Queue API] Using columns:", columns);
          
          const { data: approach2Data, error: approach2Error } = await supabase
            .from('queuemasterrcd')
            .select(columns);

          console.log("[Queue API] Approach 2 result:", { 
            count: approach2Data?.length || 0, 
            error: approach2Error?.message || null 
          });

          if (!approach2Error && approach2Data) {
            queueRows = approach2Data;
            console.log("[Queue API] Approach 2 succeeded");
          } else if (!finalError) {
            finalError = approach2Error;
          }
        } catch (err) {
          console.error("[Queue API] Approach 2 exception:", err);
          if (!finalError) {
            finalError = err;
          }
        }
      }

      // Approach 3: Raw SQL query (if available and other approaches failed)
      if (!queueRows) {
        console.log("[Queue API] Approach 3: Raw SQL query");
        try {
          const { data: approach3Data, error: approach3Error } = await supabase
            .rpc('execute_sql', { 
              sql_query: 'SELECT * FROM queuemasterrcd' 
            })
            .then(result => result)
            .catch(() => ({ data: null, error: 'Raw SQL not available' }));

          console.log("[Queue API] Approach 3 result:", { 
            count: approach3Data?.length || 0, 
            error: approach3Error || null 
          });

          if (!approach3Error && approach3Data) {
            queueRows = approach3Data;
            console.log("[Queue API] Approach 3 succeeded");
          }
        } catch (err) {
          console.error("[Queue API] Approach 3 exception:", err);
        }
      }

      // If all approaches failed, throw the error
      if (!queueRows) {
        console.error("[Queue API] All approaches failed. Final error:", finalError);
        if (finalError) {
          if (finalError instanceof Error) {
            throw new Error(`Failed to fetch queues: ${finalError.message}`);
          } else if (typeof finalError === 'object' && finalError.message) {
            throw new Error(`Failed to fetch queues: ${finalError.message}`);
          }
        }
        throw new Error("Failed to fetch queues: All query approaches failed");
      }

      console.log("[Queue API] Successfully fetched records:", queueRows.length);
      console.log("[Queue API] First record sample:", queueRows[0]);

      // Try to sort the results
      let sortedRows = queueRows;
      try {
        // Sort by queueid descending (since it's YYYYMMDD format)
        sortedRows = [...queueRows].sort((a, b) => {
          const aId = a.queueid || '';
          const bId = b.queueid || '';
          return bId.localeCompare(aId);
        });
        console.log("[Queue API] Successfully sorted by queueid");
      } catch (sortErr) {
        console.log("[Queue API] Sorting failed, using unsorted data:", sortErr);
        // Use unsorted data if sorting fails
      }

      // Map the database fields to our Queue interface
      const queues: Queue[] = sortedRows.map((row, index) => {
        console.log(`[Queue API] Processing queue ${index + 1}:`, row);
        
        try {
          const queue: Queue = {
            queueId: row.queueid || '',
            queueStartTime: row.queuestarttime ? new Date(row.queuestarttime) : null,
            queueStartedByUsername: row.queuestartedbyusername || null,
            queueEndTime: row.queueendtime ? new Date(row.queueendtime) : null,
            queueClosedByUsername: row.queueclosedbyusername || null,
            queueMasterStatus: row.queuemasterstatus || null,
            lastUpdatedTTM: row.lastupdatedttm ? new Date(row.lastupdatedttm) : null,
            archivedDTTM: row.archiveddttm ? new Date(row.archiveddttm) : null,
          };
          
          console.log(`[Queue API] Mapped queue ${index + 1}:`, queue);
          return queue;
        } catch (mapErr) {
          console.error(`[Queue API] Error mapping queue ${index + 1}:`, mapErr);
          console.error(`[Queue API] Raw row data:`, row);
          
          // Return a minimal queue object to avoid breaking the entire response
          return {
            queueId: row.queueid || `unknown_${index}`,
            queueStartTime: null,
            queueStartedByUsername: null,
            queueEndTime: null,
            queueClosedByUsername: null,
            queueMasterStatus: null,
            lastUpdatedTTM: null,
            archivedDTTM: null,
          };
        }
      });

      console.log("[Queue API] Successfully mapped and returning queues:", queues.length);
      console.log("[Queue API] Final queue list:", queues);
      console.log("[Queue API] === ENHANCED QUEUE LIST DEBUG END ===");
      
      return { queues };

    } catch (error) {
      console.error("[Queue API] === QUEUE LIST ERROR ===");
      console.error("[Queue API] Error type:", typeof error);
      console.error("[Queue API] Error constructor:", error?.constructor?.name);
      console.error("[Queue API] Full error:", error);
      
      // Log the error stack if available
      if (error instanceof Error) {
        console.error("[Queue API] Error stack:", error.stack);
      }
      
      // Return empty array instead of throwing to prevent frontend crashes
      console.error("[Queue API] Returning empty array due to error");
      return { queues: [] };
    }
  }
);
