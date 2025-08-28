import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Queue, CreateQueueRequest, CreateQueueResponse } from "./types";

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
      
      // Generate queue ID in YYYYMMDD format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const queueId = `${year}${month}${day}`;

      console.log("[Queue API] Generated queue ID:", queueId);

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

      // Now populate the dismissal queue with eligible students
      console.log("[Queue API] === POPULATING DISMISSAL QUEUE ===");
      
      try {
        // Get all eligible students (Active status and Present attendance)
        console.log("[Queue API] Fetching eligible students...");
        const { data: eligibleStudents, error: studentsError } = await supabase
          .from('studentrcd')
          .select(`
            studentid,
            studentname,
            grade,
            classbuilding,
            parentid,
            studentstatus,
            attendencestatus
          `)
          .eq('studentstatus', 'Active')
          .eq('attendencestatus', 'Present');

        if (studentsError) {
          console.error("[Queue API] Error fetching eligible students:", studentsError);
          // Don't fail the queue creation, but log the error
          console.error("[Queue API] Warning: Could not populate dismissal queue with students");
        } else {
          console.log(`[Queue API] Found ${eligibleStudents?.length || 0} eligible students`);
          
          if (eligibleStudents && eligibleStudents.length > 0) {
            // Get parent names for the students
            const parentIds = [...new Set(eligibleStudents.map(s => s.parentid).filter(Boolean))];
            console.log(`[Queue API] Fetching parent names for ${parentIds.length} unique parents...`);
            
            const { data: parents, error: parentsError } = await supabase
              .from('parentrcd')
              .select('parentid, parentname')
              .in('parentid', parentIds);

            if (parentsError) {
              console.error("[Queue API] Error fetching parent names:", parentsError);
            }

            // Create a map of parentid to parentname
            const parentNameMap = new Map();
            if (parents) {
              parents.forEach(parent => {
                parentNameMap.set(parent.parentid, parent.parentname);
              });
            }

            // Prepare dismissal queue records
            const dismissalQueueRecords = eligibleStudents.map(student => ({
              queueid: queueId,
              classbuilding: student.classbuilding || '',
              grade: student.grade || '',
              dismissalqueuestatus: 'Standby',
              parentid: student.parentid || null,
              studentid: student.studentid || null,
              studentname: student.studentname || '',
              parentname: parentNameMap.get(student.parentid) || '',
              alternatename: null,
              qrscanedat: null,
              addtoqueuemethod: 'Auto',
              qrscannedatbuilding: null,
              dismissedat: null,
              dismissedbyname: null,
              dismissstatus: null,
              studntselfdismiss: false,
              dismississue: null,
              pickupconfirmeddttm: null,
              pickupconfirmedbyname: null,
              pickuissue: null
            }));

            console.log(`[Queue API] Inserting ${dismissalQueueRecords.length} records into dismissal queue...`);
            
            // Insert records into dismissal queue
            const { data: insertedRecords, error: insertError } = await supabase
              .from('dismissalqueuercd')
              .insert(dismissalQueueRecords)
              .select('*');

            if (insertError) {
              console.error("[Queue API] Error inserting dismissal queue records:", insertError);
              // Don't fail the queue creation, but log the error
              console.error("[Queue API] Warning: Queue created but dismissal queue population failed");
            } else {
              console.log(`[Queue API] Successfully inserted ${insertedRecords?.length || 0} dismissal queue records`);
            }
          } else {
            console.log("[Queue API] No eligible students found for dismissal queue");
          }
        }
      } catch (dismissalError) {
        console.error("[Queue API] Error during dismissal queue population:", dismissalError);
        // Don't fail the queue creation, just log the error
        console.error("[Queue API] Warning: Queue created but dismissal queue population failed");
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
