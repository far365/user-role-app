import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, CreateQueueRequest, CreateQueueResponse, QueueStatus } from "./types";

// Creates a new queue with YYYYMMDD format ID and populates dismissal queue.
export const create = api<CreateQueueRequest, CreateQueueResponse>(
  { expose: true, method: "POST", path: "/queue/create" },
  async ({ queueStartedByUsername }) => {
    if (!queueStartedByUsername || !queueStartedByUsername.trim()) {
      throw APIError.invalidArgument("Username is required to start a queue");
    }

    try {
      console.log("[Queue API] === QUEUE CREATION DEBUG START ===");
      console.log("[Queue API] Creating new queue for user:", queueStartedByUsername);
      
      // Test Supabase connection first
      console.log("[Queue API] Testing Supabase connection...");
      try {
        const { data: connectionTest, error: connectionError } = await supabase
          .from('usersrcd')
          .select('count')
          .limit(1);
        
        if (connectionError) {
          console.error("[Queue API] Supabase connection failed:", connectionError);
          throw APIError.internal(`Database connection failed: ${connectionError.message}`);
        }
        console.log("[Queue API] Supabase connection: OK");
      } catch (connErr) {
        console.error("[Queue API] Supabase connection test failed:", connErr);
        throw APIError.internal("Database connection failed");
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
          if (tableTestError.code === 'PGRST116') {
            throw APIError.internal(`Table 'queuemasterrcd' does not exist: ${tableTestError.message}`);
          } else if (tableTestError.code === '42501') {
            throw APIError.internal(`Permission denied accessing 'queuemasterrcd' table: ${tableTestError.message}`);
          } else {
            throw APIError.internal(`Cannot access queuemasterrcd table: ${tableTestError.message}`);
          }
        }
        console.log("[Queue API] Table access: OK");
      } catch (tableErr) {
        console.error("[Queue API] Table access failed:", tableErr);
        if (tableErr instanceof APIError) {
          throw tableErr;
        }
        throw APIError.internal("Cannot access queuemasterrcd table");
      }
      
      // Queue ID will be auto-determined by Supabase API - no need to generate manually
      /*
      // Generate queue ID in YYYYMMDD format
      //const now = new Date();
      //const year = now.getFullYear();
      //const month = String(now.getMonth() + 1).padStart(2, '0');
      //const day = String(now.getDate()).padStart(2, '0');
      //const queueId = `${year}${month}${day}`;
			
const now = new Date();
const mytimezone = now.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();

const userDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', // e.g., 'America/Chicago'
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(now).split('/'); // MM/DD/YYYY

			const queueId = `${userDate[2]}${userDate[0]}${userDate[1]}`; // Adjust to YYYYMMDD

      console.log("[Queue API] Generated queue ID:", queueId," tz:",mytimezone,"-",now);
      */
      // Remove queue validation checks since Supabase API will handle this
      /*
//---
      // Check if there's already an open queue (any queue with status 'Open')
      console.log("[Queue API] Checking for existing open queues...");
      const { data: existingOpenQueue, error: checkOpenError } = await supabase
        .from('queuemasterrcd')
        .select('queueid, queuemasterstatus')
        .eq('queuemasterstatus', 'Open')
        .single();

      console.log("[Queue API] Existing open queue check:", { existingOpenQueue, checkOpenError });

      // If we get an error other than "no rows found", it's a real error
      if (checkOpenError && checkOpenError.code !== 'PGRST116') {
        console.error("[Queue API] Error checking for existing open queues:", checkOpenError);
        throw APIError.internal(`Failed to check existing open queues: ${checkOpenError.message}`);
      }

      if (existingOpenQueue) {
        console.log("[Queue API] Found existing open queue:", existingOpenQueue.queueid);
        throw APIError.alreadyExists(`A queue is already open with ID: ${existingOpenQueue.queueid}. The open queue must be closed before starting a new one.`);
      }

      // Check if a queue with today's ID already exists (regardless of status)
      console.log("[Queue API] Checking for existing queue with today's ID...");
      const { data: existingQueue, error: existingError } = await supabase
        .from('queuemasterrcd')
        .select('queueid, queuemasterstatus')
        .eq('queueid', queueId)
        .single();

      console.log("[Queue API] Existing queue ID check:", { existingQueue, existingError });

      // If we get an error other than "no rows found", it's a real error
      if (existingError && existingError.code !== 'PGRST116') {
        console.error("[Queue API] Error checking for existing queue ID:", existingError);
        throw APIError.internal(`Failed to check existing queue ID: ${existingError.message}`);
      }

      if (existingQueue) {
        console.log("[Queue API] Queue with this ID already exists:", queueId, "Status:", existingQueue.queuemasterstatus);
        throw APIError.alreadyExists(`A queue with ID ${queueId} already exists (Status: ${existingQueue.queuemasterstatus}). This queue must be deleted before a new one can be started for today.`);
      }
      */

      // Call the build_new_queue Supabase API instead of creating queue manually
      console.log("[Queue API] === CALLING SUPABASE build_new_queue API ===");
      
      /*
      // Create new queue - COMMENTED OUT - Using Supabase API instead
      const currentTime = new Date().toISOString();
      console.log("[Queue API] Creating queue with data:", {
        queueid: queueId,
        queuestarttime: currentTime,
        queuestartedbyusername: queueStartedByUsername.trim(),
        queueendtime: null,
        queueclosedbyusername: null,
        queuemasterstatus: 'Open',
        lastupdatedttm: currentTime,
        archiveddttm: null
      });
      */
      /*
      const { data: newQueue, error: createError } = await supabase
        .from('queuemasterrcd')
        .insert({
          queueid: queueId,
          queuestarttime: currentTime,
          queuestartedbyusername: queueStartedByUsername.trim(),
          queueendtime: null,
          queueclosedbyusername: null,
          queuemasterstatus: 'Open',
          lastupdatedttm: currentTime,
          archiveddttm: null
        })
        .select('*')
        .single();

      console.log("[Queue API] Create queue result:", { newQueue, createError });

      if (createError) {
        console.error("[Queue API] Error creating queue:", createError);
        console.error("[Queue API] Error details:", {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint
        });
        
        // Handle specific database errors
        if (createError.code === '23505') {
          throw APIError.alreadyExists(`Queue with ID ${queueId} already exists`);
        } else if (createError.code === '23503') {
          throw APIError.invalidArgument(`Foreign key constraint violation: ${createError.message}`);
        } else if (createError.code === '23514') {
          throw APIError.invalidArgument(`Check constraint violation: ${createError.message}`);
        } else if (createError.code === '42501') {
          throw APIError.internal(`Permission denied: ${createError.message}`);
        } else if (createError.code === 'PGRST116') {
          throw APIError.internal(`Table does not exist: ${createError.message}`);
        } else {
          throw APIError.internal(`Failed to create queue: ${createError.message} (Code: ${createError.code})`);
        }
      }

      if (!newQueue) {
        console.error("[Queue API] No queue data returned after creation");
        throw APIError.internal("Failed to retrieve created queue");
      }

      console.log("[Queue API] Successfully created queue:", newQueue);
      */
      
      // Call the build_new_queue Supabase API instead of creating queue manually
      console.log("[Queue API] === CALLING SUPABASE build_new_queue API ===");
      
      try {
        console.log("[Queue API] Calling build_new_queue() function...");
        
        // Call build_new_queue Supabase function which handles both queue creation and dismissal queue population
        const { data: functionResult, error: functionError } = await supabase
          .rpc('build_new_queue', {
            p_started_by_username: queueStartedByUsername.trim()
          });

        console.log("[Queue API] Supabase function result:", { functionResult, functionError });

        if (functionError) {
          console.error("[Queue API] Supabase function error:", functionError);
          console.error("[Queue API] Function error details:", {
            code: functionError.code,
            message: functionError.message,
            details: functionError.details,
            hint: functionError.hint
          });
          
          throw APIError.internal(`build_new_queue function failed: ${functionError.message}`);
        } else {
          console.log("[Queue API] SUCCESS: build_new_queue() completed successfully");
          console.log("[Queue API] Function result:", functionResult);
        }

        // Extract queue data from function result
        // The build_new_queue function should return the created queue data
        const newQueue = functionResult?.queue || {
          queueid: functionResult?.queue_id || 'auto-generated',
          queuestarttime: new Date().toISOString(),
          queuestartedbyusername: queueStartedByUsername.trim(),
          queueendtime: null,
          queueclosedbyusername: null,
          queuemasterstatus: 'Open',
          lastupdatedttm: new Date().toISOString(),
          archiveddttm: null
        };

        const queue: Queue = {
          queueId: newQueue.queueid,
          queueStartTime: newQueue.queuestarttime ? new Date(newQueue.queuestarttime) : null,
          queueStartedByUsername: newQueue.queuestartedbyusername,
          queueEndTime: newQueue.queueendtime ? new Date(newQueue.queueendtime) : null,
          queueClosedByUsername: newQueue.queueclosedbyusername,
          queueMasterStatus: (newQueue.queuemasterstatus as QueueStatus) || null,
          lastUpdatedTTM: newQueue.lastupdatedttm ? new Date(newQueue.lastupdatedttm) : null,
          archivedDTTM: newQueue.archiveddttm ? new Date(newQueue.archiveddttm) : null,
        };

        console.log("[Queue API] Mapped queue response:", queue);
        console.log("[Queue API] === QUEUE CREATION DEBUG END ===");
        return { queue };

      } catch (functionCallError) {
        console.error("[Queue API] Error calling build_new_queue Supabase function:", functionCallError);
        console.error("[Queue API] Function call error:", functionCallError instanceof Error ? functionCallError.message : String(functionCallError));
        throw APIError.internal(`Failed to call build_new_queue function: ${functionCallError instanceof Error ? functionCallError.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error("[Queue API] === QUEUE CREATION ERROR ===");
      console.error("[Queue API] Error type:", typeof error);
      console.error("[Queue API] Error constructor:", error?.constructor?.name);
      console.error("[Queue API] Full error:", error);
      
      // Log the error stack if available
      if (error instanceof Error) {
        console.error("[Queue API] Error stack:", error.stack);
      }
      
      if (error instanceof APIError) {
        console.error("[Queue API] Re-throwing APIError:", error.message);
        throw error;
      }
      
      // Handle any other unexpected errors
      if (error instanceof Error) {
        console.error("[Queue API] Unexpected Error:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Check for specific database errors that might not be caught above
        if (error.message.includes('duplicate key')) {
          throw APIError.alreadyExists(`Queue already exists: ${error.message}`);
        } else if (error.message.includes('foreign key')) {
          throw APIError.invalidArgument(`Foreign key constraint error: ${error.message}`);
        } else if (error.message.includes('check constraint')) {
          throw APIError.invalidArgument(`Check constraint error: ${error.message}`);
        } else if (error.message.includes('permission denied')) {
          throw APIError.internal(`Permission denied: ${error.message}`);
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          throw APIError.internal(`Table does not exist: ${error.message}`);
        } else {
          throw APIError.internal(`Unexpected error during queue creation: ${error.message}`);
        }
      }
      
      console.error("[Queue API] Unknown error type during queue creation:", error);
      throw APIError.internal("An unknown error occurred while creating the queue");
    }
  }
);
