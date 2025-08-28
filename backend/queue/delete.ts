import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { DeleteQueueRequest, DeleteQueueResponse } from "./types";

// Deletes a queue by queue ID.
export const deleteQueue = api<DeleteQueueRequest, DeleteQueueResponse>(
  { expose: true, method: "DELETE", path: "/queue/delete" },
  async ({ queueId }) => {
    if (!queueId || !queueId.trim()) {
      throw APIError.invalidArgument("Queue ID is required");
    }

    try {
      console.log("[Queue API] Deleting queue with ID:", queueId);
      
      // Check if queue exists
      const { data: existingQueue, error: findError } = await supabase
        .from('queuemasterrcd')
        .select('queueid, queuemasterstatus')
        .eq('queueid', queueId.trim())
        .single();

      console.log("[Queue API] Queue existence check:", { existingQueue, findError });

      if (findError) {
        if (findError.code === 'PGRST116') {
          throw APIError.notFound(`Queue with ID "${queueId}" not found`);
        }
        console.error("[Queue API] Error finding queue:", findError);
        throw APIError.internal(`Failed to find queue: ${findError.message}`);
      }

      if (!existingQueue) {
        throw APIError.notFound(`Queue with ID "${queueId}" not found`);
      }

      // Delete the queue
      const { error: deleteError } = await supabase
        .from('queuemasterrcd')
        .delete()
        .eq('queueid', queueId.trim());

      console.log("[Queue API] Delete queue result:", { deleteError });

      if (deleteError) {
        console.error("[Queue API] Error deleting queue:", deleteError);
        throw APIError.internal(`Failed to delete queue: ${deleteError.message}`);
      }

      console.log("[Queue API] Successfully deleted queue:", queueId);
      return { success: true };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Queue API] Unexpected error deleting queue:", error);
      throw APIError.internal("Failed to delete queue");
    }
  }
);
