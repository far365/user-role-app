import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, CreateQueueRequest, CreateQueueResponse } from "./types";

// Creates a new queue with YYYYMMDD format ID.
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
      
      // Check if there's already an open queue
      console.log("[Queue API] Checking for existing open queues...");
      const { data: existingOpenQueue, error: checkError } = await supabase
        .from('queuemasterrcd')
        .select('queueid, queuemasterstatus')
        .eq('queuemasterstatus', 'Open')
        .single();

      console.log("[Queue API] Existing open queue check:", { existingOpenQueue, checkError });

      // If we get an error other than "no rows found", it's a real error
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("[Queue API] Error checking for existing queues:", checkError);
        throw APIError.internal(`Failed to check existing queues: ${checkError.message}`);
      }

      if (existingOpenQueue) {
        console.log("[Queue API] Found existing open queue:", existingOpenQueue.queueid);
        throw APIError.alreadyExists(`A queue is already open with ID: ${existingOpenQueue.queueid}. Only one queue can be open at a time.`);
      }

      // Generate queue ID in YYYYMMDD format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const queueId = `${year}${month}${day}`;

      console.log("[Queue API] Generated queue ID:", queueId);

      // Check if a queue with this ID already exists
      const { data: existingQueue, error: existingError } = await supabase
        .from('queuemasterrcd')
        .select('queueid')
        .eq('queueid', queueId)
        .single();

      // If we get an error other than "no rows found", it's a real error
      if (existingError && existingError.code !== 'PGRST116') {
        console.error("[Queue API] Error checking for existing queue ID:", existingError);
        throw APIError.internal(`Failed to check existing queue ID: ${existingError.message}`);
      }

      if (existingQueue) {
        console.log("[Queue API] Queue with this ID already exists:", queueId);
        throw APIError.alreadyExists(`A queue with ID ${queueId} already exists. Only one queue per day is allowed.`);
      }

      // Create new queue
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

      const queue: Queue = {
        queueId: newQueue.queueid,
        queueStartTime: newQueue.queuestarttime ? new Date(newQueue.queuestarttime) : null,
        queueStartedByUsername: newQueue.queuestartedbyusername,
        queueEndTime: newQueue.queueendtime ? new Date(newQueue.queueendtime) : null,
        queueClosedByUsername: newQueue.queueclosedbyusername,
        queueMasterStatus: newQueue.queuemasterstatus,
        lastUpdatedTTM: newQueue.lastupdatedttm ? new Date(newQueue.lastupdatedttm) : null,
        archivedDTTM: newQueue.archiveddttm ? new Date(newQueue.archiveddttm) : null,
      };

      console.log("[Queue API] Mapped queue response:", queue);
      console.log("[Queue API] === QUEUE CREATION DEBUG END ===");
      return { queue };

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
