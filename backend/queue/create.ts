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
      console.log("[Queue API] Creating new queue for user:", queueStartedByUsername);
      
      // Check if there's already an open queue
      const { data: existingOpenQueue, error: checkError } = await supabase
        .from('queuemasterrcd')
        .select('queueid, queuemasterstatus')
        .eq('queuemasterstatus', 'Open')
        .single();

      console.log("[Queue API] Existing open queue check:", { existingOpenQueue, checkError });

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

      if (existingQueue) {
        console.log("[Queue API] Queue with this ID already exists:", queueId);
        throw APIError.alreadyExists(`A queue with ID ${queueId} already exists. Only one queue per day is allowed.`);
      }

      // Create new queue
      const currentTime = new Date().toISOString();
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
        throw APIError.internal(`Failed to create queue: ${createError.message}`);
      }

      if (!newQueue) {
        throw APIError.internal("Failed to retrieve created queue");
      }

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

      console.log("[Queue API] Successfully created queue:", queue);
      return { queue };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Queue API] Unexpected error creating queue:", error);
      throw APIError.internal("Failed to create queue");
    }
  }
);
