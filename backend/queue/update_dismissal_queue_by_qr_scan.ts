import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface UpdateDismissalQueueByQRScanRequest {
  queueId: string;
  parentId?: string;
  parentName?: string;
  alternateName?: string;
  qrScannedAtBuilding: string;
}

export interface UpdateDismissalQueueByQRScanResponse {
  success: boolean;
  updatedCount: number;
  message: string;
}

// Updates dismissal queue records based on QR scan data.
export const updateDismissalQueueByQRScan = api<UpdateDismissalQueueByQRScanRequest, UpdateDismissalQueueByQRScanResponse>(
  { expose: true, method: "PUT", path: "/queue/update-dismissal-queue-by-qr-scan" },
  async (req) => {
    const {
      queueId,
      parentId,
      parentName,
      alternateName,
      qrScannedAtBuilding
    } = req;

    // Validate required fields
    if (!queueId || !queueId.trim()) {
      throw APIError.invalidArgument("Queue ID is required");
    }

    if (!qrScannedAtBuilding || !qrScannedAtBuilding.trim()) {
      throw APIError.invalidArgument("QR scanned at building is required");
    }

    // Must have either parentId or parentName to identify records
    if (!parentId && !parentName) {
      throw APIError.invalidArgument("Either parent ID or parent name is required");
    }

    try {
      console.log("[Queue API] === UPDATING DISMISSAL QUEUE BY QR SCAN ===");
      console.log("[Queue API] Request data:", req);

      // First, check if the queue exists and is open
      const { data: queueCheck, error: queueError } = await supabase
        .from('queuemasterrcd')
        .select('queueid, queuemasterstatus')
        .eq('queueid', queueId.trim())
        .single();

      if (queueError) {
        console.error("[Queue API] Error checking queue:", queueError);
        if (queueError.code === 'PGRST116') {
          throw APIError.notFound(`Queue with ID "${queueId}" not found`);
        }
        throw APIError.internal(`Failed to check queue: ${queueError.message}`);
      }

      if (!queueCheck) {
        throw APIError.notFound(`Queue with ID "${queueId}" not found`);
      }

      if (queueCheck.queuemasterstatus !== 'Open') {
        throw APIError.invalidArgument(`Queue "${queueId}" is not open (status: ${queueCheck.queuemasterstatus})`);
      }

      console.log("[Queue API] Queue validation passed:", queueCheck);

      // Build the update fields
      const updateFields: any = {
        dismissalqueuestatus: 'InQueue',
        qrscanedat: new Date().toISOString(),
        qrscannedatbuilding: qrScannedAtBuilding.trim()
      };

      // Add parent name if provided
      if (parentName && parentName.trim()) {
        updateFields.parentname = parentName.trim();
      }

      // Add alternate name if provided
      if (alternateName && alternateName.trim()) {
        updateFields.alternatename = alternateName.trim();
      }

      console.log("[Queue API] Update fields:", updateFields);

      // Build the WHERE clause based on available identifiers
      let query = supabase
        .from('dismissalqueuercd')
        .update(updateFields)
        .eq('queueid', queueId.trim());

      // Add parent ID filter if available
      if (parentId && parentId.trim()) {
        query = query.eq('parentid', parentId.trim());
        console.log("[Queue API] Filtering by parentid:", parentId.trim());
      } else if (parentName && parentName.trim()) {
        // If no parentId, try to match by parent name
        query = query.eq('parentname', parentName.trim());
        console.log("[Queue API] Filtering by parentname:", parentName.trim());
      }

      // Execute the update
      const { data: updatedRecords, error: updateError } = await query.select('*');

      console.log("[Queue API] Update result:", { updatedRecords, updateError });

      if (updateError) {
        console.error("[Queue API] Error updating dismissal queue records:", updateError);
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
          throw APIError.internal(`Failed to update dismissal queue records: ${updateError.message} (Code: ${updateError.code})`);
        }
      }

      const updatedCount = updatedRecords?.length || 0;
      console.log("[Queue API] Successfully updated", updatedCount, "dismissal queue records");

      if (updatedCount === 0) {
        const identifier = parentId ? `parent ID "${parentId}"` : `parent name "${parentName}"`;
        console.log(`[Queue API] No records found for ${identifier} in queue ${queueId}`);
        
        return {
          success: false,
          updatedCount: 0,
          message: `No student records found for ${identifier} in queue ${queueId}`
        };
      }

      // Log the updated records for debugging
      console.log("[Queue API] Updated records:", updatedRecords);

      const contactName = alternateName || parentName || parentId || 'contact';
      const message = `Successfully updated ${updatedCount} student record(s) for ${contactName} in queue ${queueId}`;

      console.log("[Queue API] === DISMISSAL QUEUE UPDATE BY QR SCAN COMPLETE ===");

      return {
        success: true,
        updatedCount: updatedCount,
        message: message
      };

    } catch (error) {
      console.error("[Queue API] === DISMISSAL QUEUE UPDATE BY QR SCAN ERROR ===");
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
          throw APIError.internal(`Unexpected error during dismissal queue update: ${error.message}`);
        }
      }
      
      console.error("[Queue API] Unknown error type during dismissal queue update:", error);
      throw APIError.internal("An unknown error occurred while updating dismissal queue records");
    }
  }
);
