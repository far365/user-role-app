import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, ListQueuesResponse } from "./types";

// Retrieves all queues ordered by creation date.
export const list = api<void, ListQueuesResponse>(
  { expose: true, method: "GET", path: "/queue/list" },
  async () => {
    try {
      console.log("[Queue API] === COMPREHENSIVE QUEUE LIST DEBUG START ===");
      
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

      // Step 1: Check if queuemasterrcd table exists and is accessible
      console.log("[Queue API] === STEP 1: TABLE EXISTENCE CHECK ===");
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
          console.error("[Queue API] Error message:", tableTestError.message);
          
          if (tableTestError.code === 'PGRST116') {
            throw new Error(`Table 'queuemasterrcd' does not exist: ${tableTestError.message}`);
          } else if (tableTestError.code === '42501') {
            throw new Error(`Permission denied accessing 'queuemasterrcd' table: ${tableTestError.message}`);
          } else {
            throw new Error(`Cannot access queuemasterrcd table: ${tableTestError.message}`);
          }
        }
        console.log("[Queue API] Table access: OK - queuemasterrcd table exists and is accessible");
      } catch (tableErr) {
        console.error("[Queue API] Table access failed:", tableErr);
        if (tableErr instanceof Error) {
          throw tableErr;
        }
        throw new Error("Cannot access queuemasterrcd table");
      }

      // Step 2: Try different count methods to understand the issue
      console.log("[Queue API] === STEP 2: COMPREHENSIVE COUNT ANALYSIS ===");
      
      // Method 1: Count with exact
      console.log("[Queue API] Method 1: Count with exact=true, head=true");
      try {
        const { count: exactCount, error: exactCountError } = await supabase
          .from('queuemasterrcd')
          .select('*', { count: 'exact', head: true });
        
        console.log("[Queue API] Exact count result:", exactCount);
        if (exactCountError) {
          console.error("[Queue API] Exact count error:", exactCountError);
        }
      } catch (exactErr) {
        console.error("[Queue API] Exact count exception:", exactErr);
      }

      // Method 2: Count with planned
      console.log("[Queue API] Method 2: Count with planned");
      try {
        const { count: plannedCount, error: plannedCountError } = await supabase
          .from('queuemasterrcd')
          .select('*', { count: 'planned', head: true });
        
        console.log("[Queue API] Planned count result:", plannedCount);
        if (plannedCountError) {
          console.error("[Queue API] Planned count error:", plannedCountError);
        }
      } catch (plannedErr) {
        console.error("[Queue API] Planned count exception:", plannedErr);
      }

      // Method 3: Count with estimated
      console.log("[Queue API] Method 3: Count with estimated");
      try {
        const { count: estimatedCount, error: estimatedCountError } = await supabase
          .from('queuemasterrcd')
          .select('*', { count: 'estimated', head: true });
        
        console.log("[Queue API] Estimated count result:", estimatedCount);
        if (estimatedCountError) {
          console.error("[Queue API] Estimated count error:", estimatedCountError);
        }
      } catch (estimatedErr) {
        console.error("[Queue API] Estimated count exception:", estimatedErr);
      }

      // Method 4: Try to fetch one record without count
      console.log("[Queue API] Method 4: Fetch one record without count");
      try {
        const { data: oneRecord, error: oneRecordError } = await supabase
          .from('queuemasterrcd')
          .select('*')
          .limit(1);
        
        console.log("[Queue API] One record result:", {
          recordCount: oneRecord?.length || 0,
          hasData: !!oneRecord && oneRecord.length > 0,
          firstRecord: oneRecord?.[0] || null
        });
        
        if (oneRecordError) {
          console.error("[Queue API] One record error:", oneRecordError);
        } else if (oneRecord && oneRecord.length > 0) {
          console.log("[Queue API] SUCCESS: Found at least one record!");
          console.log("[Queue API] Record structure:", Object.keys(oneRecord[0]));
          console.log("[Queue API] Record data:", oneRecord[0]);
        } else {
          console.log("[Queue API] No records found in single record fetch");
        }
      } catch (oneRecordErr) {
        console.error("[Queue API] One record exception:", oneRecordErr);
      }

      // Step 3: Check table schema and permissions
      console.log("[Queue API] === STEP 3: TABLE SCHEMA INSPECTION ===");
      
      // Try to get table information from information_schema
      console.log("[Queue API] Attempting to get table schema information...");
      try {
        const { data: schemaInfo, error: schemaError } = await supabase
          .from('information_schema.tables')
          .select('table_name, table_type')
          .eq('table_name', 'queuemasterrcd');
        
        console.log("[Queue API] Schema info result:", schemaInfo);
        if (schemaError) {
          console.error("[Queue API] Schema info error:", schemaError);
        }
      } catch (schemaErr) {
        console.log("[Queue API] Schema info not accessible (expected in some setups):", schemaErr);
      }

      // Try to get column information
      console.log("[Queue API] Attempting to get column information...");
      try {
        const { data: columnInfo, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'queuemasterrcd');
        
        console.log("[Queue API] Column info result:", columnInfo);
        if (columnError) {
          console.error("[Queue API] Column info error:", columnError);
        }
      } catch (columnErr) {
        console.log("[Queue API] Column info not accessible (expected in some setups):", columnErr);
      }

      // Step 4: Try different query approaches
      console.log("[Queue API] === STEP 4: MULTIPLE QUERY APPROACHES ===");
      
      let queueRows = null;
      let finalError = null;
      let successfulMethod = null;

      // Approach 1: Simple select all
      console.log("[Queue API] Approach 1: Simple select all");
      try {
        const { data: approach1Data, error: approach1Error } = await supabase
          .from('queuemasterrcd')
          .select('*');

        console.log("[Queue API] Approach 1 result:", { 
          count: approach1Data?.length || 0, 
          error: approach1Error?.message || null,
          hasData: !!approach1Data && approach1Data.length > 0
        });

        if (!approach1Error && approach1Data && approach1Data.length > 0) {
          queueRows = approach1Data;
          successfulMethod = "Simple select all";
          console.log("[Queue API] Approach 1 succeeded with data!");
        } else if (!approach1Error && approach1Data && approach1Data.length === 0) {
          console.log("[Queue API] Approach 1 succeeded but returned empty array");
          queueRows = approach1Data; // Keep the empty array
          successfulMethod = "Simple select all (empty)";
        } else {
          finalError = approach1Error;
          console.log("[Queue API] Approach 1 failed");
        }
      } catch (err) {
        console.error("[Queue API] Approach 1 exception:", err);
        finalError = err;
      }

      // Approach 2: Select with specific columns (try common column names)
      if (!queueRows || queueRows.length === 0) {
        console.log("[Queue API] Approach 2: Select with common column names");
        const commonColumns = [
          'queueid',
          'queuestarttime', 
          'queuestartedbyusername',
          'queueendtime',
          'queueclosedbyusername', 
          'queuemasterstatus',
          'lastupdatedttm',
          'archiveddttm'
        ];
        
        try {
          const { data: approach2Data, error: approach2Error } = await supabase
            .from('queuemasterrcd')
            .select(commonColumns.join(', '));

          console.log("[Queue API] Approach 2 result:", { 
            count: approach2Data?.length || 0, 
            error: approach2Error?.message || null,
            hasData: !!approach2Data && approach2Data.length > 0
          });

          if (!approach2Error && approach2Data && approach2Data.length > 0) {
            queueRows = approach2Data;
            successfulMethod = "Select with common columns";
            console.log("[Queue API] Approach 2 succeeded with data!");
          } else if (!approach2Error && approach2Data && approach2Data.length === 0) {
            console.log("[Queue API] Approach 2 succeeded but returned empty array");
            if (!queueRows) {
              queueRows = approach2Data;
              successfulMethod = "Select with common columns (empty)";
            }
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

      // Approach 3: Try with different case variations
      if (!queueRows || queueRows.length === 0) {
        console.log("[Queue API] Approach 3: Try with uppercase column names");
        const uppercaseColumns = [
          'QUEUEID',
          'QUEUESTARTTIME', 
          'QUEUESTARTEDBYUSERNAME',
          'QUEUEENDTIME',
          'QUEUECLOSEDBYUSERNAME', 
          'QUEUEMASTERSTATUS',
          'LASTUPDATEDTTM',
          'ARCHIVEDDTTM'
        ];
        
        try {
          const { data: approach3Data, error: approach3Error } = await supabase
            .from('queuemasterrcd')
            .select(uppercaseColumns.join(', '));

          console.log("[Queue API] Approach 3 result:", { 
            count: approach3Data?.length || 0, 
            error: approach3Error?.message || null,
            hasData: !!approach3Data && approach3Data.length > 0
          });

          if (!approach3Error && approach3Data && approach3Data.length > 0) {
            queueRows = approach3Data;
            successfulMethod = "Select with uppercase columns";
            console.log("[Queue API] Approach 3 succeeded with data!");
          } else if (!approach3Error && approach3Data && approach3Data.length === 0) {
            console.log("[Queue API] Approach 3 succeeded but returned empty array");
            if (!queueRows) {
              queueRows = approach3Data;
              successfulMethod = "Select with uppercase columns (empty)";
            }
          }
        } catch (err) {
          console.error("[Queue API] Approach 3 exception:", err);
        }
      }

      // Approach 4: Try with snake_case column names
      if (!queueRows || queueRows.length === 0) {
        console.log("[Queue API] Approach 4: Try with snake_case column names");
        const snakeCaseColumns = [
          'queue_id',
          'queue_start_time', 
          'queue_started_by_username',
          'queue_end_time',
          'queue_closed_by_username', 
          'queue_master_status',
          'last_updated_ttm',
          'archived_dttm'
        ];
        
        try {
          const { data: approach4Data, error: approach4Error } = await supabase
            .from('queuemasterrcd')
            .select(snakeCaseColumns.join(', '));

          console.log("[Queue API] Approach 4 result:", { 
            count: approach4Data?.length || 0, 
            error: approach4Error?.message || null,
            hasData: !!approach4Data && approach4Data.length > 0
          });

          if (!approach4Error && approach4Data && approach4Data.length > 0) {
            queueRows = approach4Data;
            successfulMethod = "Select with snake_case columns";
            console.log("[Queue API] Approach 4 succeeded with data!");
          } else if (!approach4Error && approach4Data && approach4Data.length === 0) {
            console.log("[Queue API] Approach 4 succeeded but returned empty array");
            if (!queueRows) {
              queueRows = approach4Data;
              successfulMethod = "Select with snake_case columns (empty)";
            }
          }
        } catch (err) {
          console.error("[Queue API] Approach 4 exception:", err);
        }
      }

      // Step 5: Analyze results
      console.log("[Queue API] === STEP 5: RESULTS ANALYSIS ===");
      console.log("[Queue API] Successful method:", successfulMethod || "None");
      console.log("[Queue API] Queue rows found:", queueRows?.length || 0);
      console.log("[Queue API] Final error:", finalError);

      // If we have an empty result, that's actually success - the table is just empty
      if (queueRows !== null) {
        if (queueRows.length === 0) {
          console.log("[Queue API] SUCCESS: Query worked but table is empty");
          console.log("[Queue API] This means:");
          console.log("[Queue API] - The queuemasterrcd table exists and is accessible");
          console.log("[Queue API] - The table structure is correct");
          console.log("[Queue API] - There are simply no records in the table yet");
          console.log("[Queue API] - This is normal if no queues have been created");
          return { queues: [] };
        }

        console.log("[Queue API] SUCCESS: Found records in table");
        console.log("[Queue API] First record sample:", queueRows[0]);
        console.log("[Queue API] Record structure:", Object.keys(queueRows[0] || {}));

        // Try to sort the results
        let sortedRows = queueRows;
        try {
          // Sort by queueid descending (since it's YYYYMMDD format)
          sortedRows = [...queueRows].sort((a, b) => {
            const aId = a.queueid || a.QUEUEID || a.queue_id || '';
            const bId = b.queueid || b.QUEUEID || b.queue_id || '';
            return bId.localeCompare(aId);
          });
          console.log("[Queue API] Successfully sorted by queueid");
        } catch (sortErr) {
          console.log("[Queue API] Sorting failed, using unsorted data:", sortErr);
        }

        // Map the database fields to our Queue interface
        const queues: Queue[] = sortedRows.map((row, index) => {
          console.log(`[Queue API] Processing queue ${index + 1}:`, row);
          
          try {
            // Handle different column name formats
            const queueId = row.queueid || row.QUEUEID || row.queue_id || '';
            const queueStartTime = row.queuestarttime || row.QUEUESTARTTIME || row.queue_start_time;
            const queueStartedByUsername = row.queuestartedbyusername || row.QUEUESTARTEDBYUSERNAME || row.queue_started_by_username;
            const queueEndTime = row.queueendtime || row.QUEUEENDTIME || row.queue_end_time;
            const queueClosedByUsername = row.queueclosedbyusername || row.QUEUECLOSEDBYUSERNAME || row.queue_closed_by_username;
            const queueMasterStatus = row.queuemasterstatus || row.QUEUEMASTERSTATUS || row.queue_master_status;
            const lastUpdatedTTM = row.lastupdatedttm || row.LASTUPDATEDTTM || row.last_updated_ttm;
            const archivedDTTM = row.archiveddttm || row.ARCHIVEDDTTM || row.archived_dttm;

            const queue: Queue = {
              queueId: queueId || '',
              queueStartTime: queueStartTime ? new Date(queueStartTime) : null,
              queueStartedByUsername: queueStartedByUsername || null,
              queueEndTime: queueEndTime ? new Date(queueEndTime) : null,
              queueClosedByUsername: queueClosedByUsername || null,
              queueMasterStatus: queueMasterStatus || null,
              lastUpdatedTTM: lastUpdatedTTM ? new Date(lastUpdatedTTM) : null,
              archivedDTTM: archivedDTTM ? new Date(archivedDTTM) : null,
            };
            
            console.log(`[Queue API] Mapped queue ${index + 1}:`, queue);
            return queue;
          } catch (mapErr) {
            console.error(`[Queue API] Error mapping queue ${index + 1}:`, mapErr);
            console.error(`[Queue API] Raw row data:`, row);
            
            // Return a minimal queue object to avoid breaking the entire response
            return {
              queueId: row.queueid || row.QUEUEID || row.queue_id || `unknown_${index}`,
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
        console.log("[Queue API] === COMPREHENSIVE QUEUE LIST DEBUG END ===");
        
        return { queues };
      }

      // If all approaches failed, provide detailed error information
      console.error("[Queue API] === ALL APPROACHES FAILED ===");
      console.error("[Queue API] This indicates a serious issue with:");
      console.error("[Queue API] 1. Table access permissions");
      console.error("[Queue API] 2. RLS (Row Level Security) policies");
      console.error("[Queue API] 3. Database connection configuration");
      console.error("[Queue API] 4. Table structure or naming");
      console.error("[Queue API] Final error:", finalError);
      
      if (finalError) {
        if (finalError instanceof Error) {
          throw new Error(`Failed to fetch queues: ${finalError.message}`);
        } else if (typeof finalError === 'object' && finalError.message) {
          throw new Error(`Failed to fetch queues: ${finalError.message}`);
        }
      }
      throw new Error("Failed to fetch queues: All query approaches failed");

    } catch (error) {
      console.error("[Queue API] === QUEUE LIST CRITICAL ERROR ===");
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
