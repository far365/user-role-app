import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface UpdateDismissalStatusRequest {
  studentId: string;
  queueId: string;
  newStatus: string;
  dismissedByName?: string;
}

export interface UpdateDismissalStatusResponse {
  success: boolean;
  updatedRecord: {
    queueId: string;
    studentId: string;
    studentName: string;
    dismissalQueueStatus: string;
    dismissedAt?: Date;
    dismissedByName?: string;
  };
}

// Updates the dismissal queue status for a specific student in a specific queue.
export const updateDismissalStatusByStudent = api<UpdateDismissalStatusRequest, UpdateDismissalStatusResponse>(
  { expose: true, method: "PUT", path: "/queue/update-dismissal-status" },
  async ({ studentId, queueId, newStatus, dismissedByName }) => {
    // Validate required fields
    if (!studentId || !studentId.trim()) {
      throw APIError.invalidArgument("Student ID is required");
    }

    if (!queueId || !queueId.trim()) {
      throw APIError.invalidArgument("Queue ID is required");
    }

    if (!newStatus || !newStatus.trim()) {
      throw APIError.invalidArgument("New status is required");
    }

    // Validate status values
    const validStatuses = [
      'Standby', 'InQueue', 'Released', 'Collected', 'Unknown', 
      'NoShow', 'EarlyDismissal', 'DirectPickup', 'LatePickup', 'AfterCare'
    ];
    
    if (!validStatuses.includes(newStatus.trim())) {
      throw APIError.invalidArgument(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      console.log("[Queue API] === UPDATING DISMISSAL STATUS ===");
      console.log("[Queue API] Student ID:", studentId.trim());
      console.log("[Queue API] Queue ID:", queueId.trim());
      console.log("[Queue API] New Status:", newStatus.trim());
      console.log("[Queue API] Dismissed By:", dismissedByName || 'Not specified');

      // First, check if the record exists
      const { data: existingRecord, error: findError } = await supabase
        .from('dismissalqueuercd')
        .select('*')
        .eq('queueid', queueId.trim())
        .eq('studentid', studentId.trim())
        .single();

      console.log("[Queue API] Existing record check:", { existingRecord, findError });

      if (findError) {
        if (findError.code === 'PGRST116') {
          throw APIError.notFound(`No dismissal queue record found for student "${studentId}" in queue "${queueId}"`);
        }
        console.error("[Queue API] Error finding record:", findError);
        throw APIError.internal(`Failed to find dismissal queue record: ${findError.message}`);
      }

      if (!existingRecord) {
        throw APIError.notFound(`No dismissal queue record found for student "${studentId}" in queue "${queueId}"`);
      }

      console.log("[Queue API] Found existing record:", existingRecord);
      console.log("[Queue API] Current status:", existingRecord.dismissalqueuestatus);

      // Prepare update fields
      const updateFields: any = {
        dismissalqueuestatus: newStatus.trim()
      };

      // Set dismissedAt timestamp for certain statuses
      if (['Released', 'Collected', 'NoShow', 'EarlyDismissal', 'DirectPickup'].includes(newStatus.trim())) {
        updateFields.dismissedat = new Date().toISOString();
      }

      // Set dismissedByName if provided
      if (dismissedByName && dismissedByName.trim()) {
        updateFields.dismissedbyname = dismissedByName.trim();
      }

      console.log("[Queue API] Update fields:", updateFields);

      // Update the record
      const { data: updatedRecord, error: updateError } = await supabase
        .from('dismissalqueuercd')
        .update(updateFields)
        .eq('queueid', queueId.trim())
        .eq('studentid', studentId.trim())
        .select('*')
        .single();

      console.log("[Queue API] Update result:", { updatedRecord, updateError });

      if (updateError) {
        console.error("[Queue API] Error updating record:", updateError);
        console.error("[Queue API] Error details:", {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        
        // Handle specific database errors
        if (updateError.code === '23514') {
          throw APIError.invalidArgument(`Check constraint violation: ${updateError.message}`);
        } else if (updateError.code === '42501') {
          throw APIError.internal(`Permission denied: ${updateError.message}`);
        } else if (updateError.code === 'PGRST116') {
          throw APIError.internal(`Table does not exist: ${updateError.message}`);
        } else {
          throw APIError.internal(`Failed to update dismissal status: ${updateError.message} (Code: ${updateError.code})`);
        }
      }

      if (!updatedRecord) {
        console.error("[Queue API] No record data returned after update");
        throw APIError.internal("Failed to retrieve updated record");
      }

      console.log("[Queue API] Successfully updated dismissal status:", updatedRecord);
      console.log("[Queue API] === DISMISSAL STATUS UPDATE COMPLETE ===");

      // Return the updated record information
      const response = {
        success: true,
        updatedRecord: {
          queueId: String(updatedRecord.queueid || ''),
          studentId: String(updatedRecord.studentid || ''),
          studentName: updatedRecord.studentname || '',
          dismissalQueueStatus: updatedRecord.dismissalqueuestatus || '',
          dismissedAt: updatedRecord.dismissedat ? new Date(updatedRecord.dismissedat) : undefined,
          dismissedByName: updatedRecord.dismissedbyname || undefined,
        }
      };

      console.log("[Queue API] Returning response:", response);
      return response;

    } catch (error) {
      console.error("[Queue API] === DISMISSAL STATUS UPDATE ERROR ===");
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
          throw APIError.alreadyExists(`Duplicate record error: ${error.message}`);
        } else if (error.message.includes('foreign key')) {
          throw APIError.invalidArgument(`Foreign key constraint error: ${error.message}`);
        } else if (error.message.includes('check constraint')) {
          throw APIError.invalidArgument(`Check constraint error: ${error.message}`);
        } else if (error.message.includes('permission denied')) {
          throw APIError.internal(`Permission denied: ${error.message}`);
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          throw APIError.internal(`Table does not exist: ${error.message}`);
        } else {
          throw APIError.internal(`Unexpected error during dismissal status update: ${error.message}`);
        }
      }
      
      console.error("[Queue API] Unknown error type during dismissal status update:", error);
      throw APIError.internal("An unknown error occurred while updating dismissal status");
    }
  }
);
