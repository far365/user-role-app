import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface BuildNewQueueRequest {
  queueStartedByUsername: string;
}

export interface BuildNewQueueResponse {
  success: boolean;
  message: string;
  details?: string;
  result?: any;
}

// Calls the build_new_queue Supabase function directly
export const buildNewQueue = api<BuildNewQueueRequest, BuildNewQueueResponse>(
  { expose: true, method: "POST", path: "/queue/build-new-queue" },
  async ({ queueStartedByUsername }) => {
    if (!queueStartedByUsername || !queueStartedByUsername.trim()) {
      throw APIError.invalidArgument("Username is required to build new queue");
    }

    try {
      console.log("[Build New Queue API] Calling build_new_queue Supabase function");
      console.log("[Build New Queue API] Username:", queueStartedByUsername);
      
      // Call the build_new_queue Supabase function directly
      const { data: functionResult, error: functionError } = await supabase
        .rpc('build_new_queue', {
          p_username: queueStartedByUsername.trim()
        });

      console.log("[Build New Queue API] Supabase function result:", { functionResult, functionError });

      if (functionError) {
        console.error("[Build New Queue API] Supabase function error:", functionError);
        console.error("[Build New Queue API] Function error details:", {
          code: functionError.code,
          message: functionError.message,
          details: functionError.details,
          hint: functionError.hint
        });
        
        return {
          success: false,
          message: `build_new_queue function failed: ${functionError.message}`,
          details: `Error code: ${functionError.code}. ${functionError.details || ''}`,
          result: null
        };
      }

      console.log("[Build New Queue API] SUCCESS: build_new_queue() completed successfully");
      console.log("[Build New Queue API] Function result:", functionResult);

      return {
        success: true,
        message: "build_new_queue function executed successfully",
        details: "The Supabase build_new_queue() function has populated the dismissal queue with eligible students.",
        result: functionResult
      };

    } catch (error) {
      console.error("[Build New Queue API] Error calling build_new_queue Supabase function:", error);
      
      if (error instanceof Error) {
        console.error("[Build New Queue API] Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Handle specific database errors
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          throw APIError.internal(`Supabase function 'build_new_queue' does not exist: ${error.message}`);
        } else if (error.message.includes('permission denied')) {
          throw APIError.internal(`Permission denied calling build_new_queue function: ${error.message}`);
        } else if (error.message.includes('connection')) {
          throw APIError.internal(`Database connection error: ${error.message}`);
        } else {
          throw APIError.internal(`Error calling build_new_queue function: ${error.message}`);
        }
      }
      
      throw APIError.internal("Unknown error occurred while calling build_new_queue function");
    }
  }
);