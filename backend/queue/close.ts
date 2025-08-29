import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, CloseQueueRequest, CloseQueueResponse } from "./types";

// Closes the currently open queue using Supabase function.
export const close = api<CloseQueueRequest, CloseQueueResponse>(
  { expose: true, method: "PUT", path: "/queue/close" },
  async ({ queueClosedByUsername }) => {
    if (!queueClosedByUsername || !queueClosedByUsername.trim()) {
      throw APIError.invalidArgument("Username is required to close a queue");
    }

    try {
      console.log("[Queue API] Closing open queue using Supabase function for user:", queueClosedByUsername);
      
      // First, get the user's userid from the usersrcd table
      const { data: userRow, error: userError } = await supabase
        .from('usersrcd')
        .select('userid')
        .eq('loginid', queueClosedByUsername.trim())
        .single();

      console.log("[Queue API] User lookup result:", { userRow, userError });

      if (userError) {
        console.error("[Queue API] Error finding user:", userError);
        throw APIError.notFound(`User not found: ${userError.message}`);
      }

      if (!userRow || !userRow.userid) {
        throw APIError.notFound("User not found or missing userid");
      }

      console.log("[Queue API] Found userid:", userRow.userid);

      // Call the Supabase function to close the currently open queue
      console.log("[Queue API] === CALLING SUPABASE FUNCTION TO CLOSE QUEUE ===");
      console.log(`[Queue API] Calling close_currently_open_queue('${userRow.userid}')`);
      
      const { data: functionResult, error: functionError } = await supabase
        .rpc('close_currently_open_queue', { p_userid: userRow.userid });

      console.log("[Queue API] Supabase function result:", { functionResult, functionError });

      if (functionError) {
        console.error("[Queue API] Supabase function error:", functionError);
        console.error("[Queue API] Function error details:", {
          code: functionError.code,
          message: functionError.message,
          details: functionError.details,
          hint: functionError.hint
        });
        
        // Handle specific function errors
        if (functionError.message.includes('No open queue found')) {
          throw APIError.notFound("No open queue found to close");
        } else {
          throw APIError.internal(`Failed to close queue: ${functionError.message}`);
        }
      }

      if (!functionResult) {
        console.error("[Queue API] No result returned from Supabase function");
        throw APIError.internal("No result returned from close queue function");
      }

      console.log("[Queue API] SUCCESS: close_currently_open_queue() completed successfully");
      console.log("[Queue API] Function result:", functionResult);

      // The function should return the closed queue data
      // Parse the result and create our Queue object
      const closedQueueData = functionResult;
      
      const queue: Queue = {
        queueId: closedQueueData.queueid || closedQueueData.queue_id || '',
        queueStartTime: closedQueueData.queuestarttime || closedQueueData.queue_start_time 
          ? new Date(closedQueueData.queuestarttime || closedQueueData.queue_start_time) 
          : null,
        queueStartedByUsername: closedQueueData.queuestartedbyusername || closedQueueData.queue_started_by_username || null,
        queueEndTime: closedQueueData.queueendtime || closedQueueData.queue_end_time 
          ? new Date(closedQueueData.queueendtime || closedQueueData.queue_end_time) 
          : null,
        queueClosedByUsername: closedQueueData.queueclosedbyusername || closedQueueData.queue_closed_by_username || null,
        queueMasterStatus: closedQueueData.queuemasterstatus || closedQueueData.queue_master_status || null,
        lastUpdatedTTM: closedQueueData.lastupdatedttm || closedQueueData.last_updated_ttm 
          ? new Date(closedQueueData.lastupdatedttm || closedQueueData.last_updated_ttm) 
          : null,
        archivedDTTM: closedQueueData.archiveddttm || closedQueueData.archived_dttm 
          ? new Date(closedQueueData.archiveddttm || closedQueueData.archived_dttm) 
          : null,
      };

      console.log("[Queue API] Successfully closed queue using Supabase function:", queue);
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
