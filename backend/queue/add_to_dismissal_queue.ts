import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface AddToDismissalQueueRequest {
  queueId: string;
  classBuilding: string;
  grade?: string;
  dismissalQueueStatus: string;
  parentId?: string;
  studentId?: string;
  studentName?: string;
  parentName?: string;
  alternateName?: string;
  addToQueueMethod: string;
  qrScannedAtBuilding?: string;
  dismissedByName?: string;
  dismissStatus?: string;
  studentSelfDismiss?: boolean;
  dismissIssue?: string;
  pickupConfirmedByName?: string;
  pickupIssue?: string;
}

export interface AddToDismissalQueueResponse {
  success: boolean;
  recordId: string;
}

// Adds a new record to the dismissal queue.
export const addToDismissalQueue = api<AddToDismissalQueueRequest, AddToDismissalQueueResponse>(
  { expose: true, method: "POST", path: "/queue/add-to-dismissal-queue" },
  async (req) => {
    const {
      queueId,
      classBuilding,
      grade,
      dismissalQueueStatus,
      parentId,
      studentId,
      studentName,
      parentName,
      alternateName,
      addToQueueMethod,
      qrScannedAtBuilding,
      dismissedByName,
      dismissStatus,
      studentSelfDismiss,
      dismissIssue,
      pickupConfirmedByName,
      pickupIssue
    } = req;

    // Validate required fields
    if (!queueId || !queueId.trim()) {
      throw APIError.invalidArgument("Queue ID is required");
    }

    if (!classBuilding || !classBuilding.trim()) {
      throw APIError.invalidArgument("Class building is required");
    }

    if (!dismissalQueueStatus || !dismissalQueueStatus.trim()) {
      throw APIError.invalidArgument("Dismissal queue status is required");
    }

    if (!addToQueueMethod || !addToQueueMethod.trim()) {
      throw APIError.invalidArgument("Add to queue method is required");
    }

    try {
      console.log("[Queue API] === ADDING RECORD TO DISMISSAL QUEUE ===");
      console.log("[Queue API] Request data:", req);

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

      // Test if dismissalqueuercd table is accessible
      console.log("[Queue API] Testing dismissalqueuercd table access...");
      try {
        const { error: tableTestError } = await supabase
          .from('dismissalqueuercd')
          .select('*')
          .limit(0);
        
        if (tableTestError) {
          console.error("[Queue API] Dismissal table access error:", tableTestError);
          if (tableTestError.code === 'PGRST116') {
            throw APIError.internal(`Table 'dismissalqueuercd' does not exist: ${tableTestError.message}`);
          } else if (tableTestError.code === '42501') {
            throw APIError.internal(`Permission denied accessing 'dismissalqueuercd' table: ${tableTestError.message}`);
          } else {
            throw APIError.internal(`Cannot access dismissalqueuercd table: ${tableTestError.message}`);
          }
        }
        console.log("[Queue API] Dismissal table access: OK");
      } catch (tableErr) {
        console.error("[Queue API] Dismissal table access failed:", tableErr);
        if (tableErr instanceof APIError) {
          throw tableErr;
        }
        throw APIError.internal("Cannot access dismissalqueuercd table");
      }

      // Create a unique record ID using timestamp and random component
      const currentTime = new Date().toISOString();
      const uniqueRecordId = `${queueId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare the record data
      const recordData = {
        queueid: uniqueRecordId, // Use unique ID as primary key
        classbuilding: classBuilding.trim(),
        grade: grade?.trim() || null,
        dismissalqueuestatus: dismissalQueueStatus.trim(),
        parentid: parentId?.trim() || null,
        studentid: studentId?.trim() || null,
        studentname: studentName?.trim() || null,
        parentname: parentName?.trim() || null,
        alternatename: alternateName?.trim() || null,
        qrscanedat: null, // Will be set when QR code is scanned
        addtoqueuemethod: addToQueueMethod.trim(),
        qrscannedatbuilding: qrScannedAtBuilding?.trim() || null,
        dismissedat: null, // Will be set when student is dismissed
        dismissedbyname: dismissedByName?.trim() || null,
        dismissstatus: dismissStatus?.trim() || null,
        studntselfdismiss: studentSelfDismiss || false,
        dismississue: dismissIssue?.trim() || null,
        pickupconfirmeddttm: null, // Will be set when pickup is confirmed
        pickupconfirmedbyname: pickupConfirmedByName?.trim() || null,
        pickuissue: pickupIssue?.trim() || null
      };

      console.log("[Queue API] Inserting dismissal queue record:", recordData);

      // Insert the record
      const { data: insertedRecord, error: insertError } = await supabase
        .from('dismissalqueuercd')
        .insert(recordData)
        .select('*')
        .single();

      if (insertError) {
        console.error("[Queue API] Error inserting dismissal queue record:", insertError);
        console.error("[Queue API] Error details:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        // Handle specific database errors
        if (insertError.code === '23505') {
          throw APIError.alreadyExists(`Record with this ID already exists: ${insertError.message}`);
        } else if (insertError.code === '23503') {
          throw APIError.invalidArgument(`Foreign key constraint violation: ${insertError.message}`);
        } else if (insertError.code === '23514') {
          throw APIError.invalidArgument(`Check constraint violation: ${insertError.message}`);
        } else if (insertError.code === '42501') {
          throw APIError.internal(`Permission denied: ${insertError.message}`);
        } else if (insertError.code === 'PGRST116') {
          throw APIError.internal(`Table does not exist: ${insertError.message}`);
        } else {
          throw APIError.internal(`Failed to insert dismissal queue record: ${insertError.message} (Code: ${insertError.code})`);
        }
      }

      if (!insertedRecord) {
        console.error("[Queue API] No record data returned after insertion");
        throw APIError.internal("Failed to retrieve inserted record");
      }

      console.log("[Queue API] Successfully inserted dismissal queue record:", insertedRecord);
      console.log("[Queue API] === DISMISSAL QUEUE RECORD INSERTION COMPLETE ===");

      return {
        success: true,
        recordId: uniqueRecordId
      };

    } catch (error) {
      console.error("[Queue API] === DISMISSAL QUEUE INSERTION ERROR ===");
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
          throw APIError.internal(`Unexpected error during dismissal queue insertion: ${error.message}`);
        }
      }
      
      console.error("[Queue API] Unknown error type during dismissal queue insertion:", error);
      throw APIError.internal("An unknown error occurred while adding record to dismissal queue");
    }
  }
);
