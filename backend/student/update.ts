import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Student } from "./types";

export interface UpdateStudentRequest {
  studentId: string;
  studentName?: string;
  grade?: string;
  classBuilding?: string;
  parentId?: string;
  studentStatus?: string;
  attendanceStatus?: string;
  dismissalInstructions?: string;
  otherNote?: string;
}

export interface UpdateStudentResponse {
  student: Student;
}

// Updates student information by student ID.
export const update = api<UpdateStudentRequest, UpdateStudentResponse>(
  { expose: true, method: "PUT", path: "/student/update" },
  async (req) => {
    const { studentId, ...updateData } = req;

    if (!studentId) {
      throw APIError.invalidArgument("Student ID is required");
    }

    // Convert studentId to string if it's a number
    const studentIdStr = String(studentId).trim();

    try {
      console.log(`[Student API] === STUDENT UPDATE DEBUG START ===`);
      console.log(`[Student API] Updating student data for ID: "${studentIdStr}"`);
      console.log(`[Student API] Update data received:`, updateData);
      console.log(`[Student API] Original studentId type:`, typeof studentId);
      console.log(`[Student API] Converted studentId:`, studentIdStr);
      
      // Test Supabase connection first
      console.log(`[Student API] Testing Supabase connection...`);
      try {
        const { data: connectionTest, error: connectionError } = await supabase
          .from('usersrcd')
          .select('count')
          .limit(1);
        
        if (connectionError) {
          console.error(`[Student API] Supabase connection failed:`, connectionError);
          throw APIError.internal(`Database connection failed: ${connectionError.message}`);
        }
        console.log(`[Student API] Supabase connection: OK`);
      } catch (connErr) {
        console.error(`[Student API] Supabase connection test failed:`, connErr);
        throw APIError.internal("Database connection failed");
      }

      // Test if studentrcd table is accessible
      console.log(`[Student API] Testing studentrcd table access...`);
      try {
        const { error: tableTestError } = await supabase
          .from('studentrcd')
          .select('*')
          .limit(0);
        
        if (tableTestError) {
          console.error(`[Student API] Table access error:`, tableTestError);
          if (tableTestError.code === 'PGRST116') {
            throw APIError.internal(`Table 'studentrcd' does not exist: ${tableTestError.message}`);
          } else if (tableTestError.code === '42501') {
            throw APIError.internal(`Permission denied accessing 'studentrcd' table: ${tableTestError.message}`);
          } else {
            throw APIError.internal(`Cannot access studentrcd table: ${tableTestError.message}`);
          }
        }
        console.log(`[Student API] Table access: OK`);
      } catch (tableErr) {
        console.error(`[Student API] Table access failed:`, tableErr);
        if (tableErr instanceof APIError) {
          throw tableErr;
        }
        throw APIError.internal("Cannot access studentrcd table");
      }
      
      // First, get the current student record to check if it exists and validate parentId changes
      console.log(`[Student API] Fetching current student record...`);
      const { data: currentStudent, error: fetchError } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('studentid', studentIdStr)
        .single();

      console.log(`[Student API] Current student fetch result:`, { currentStudent, fetchError });

      if (fetchError) {
        console.error(`[Student API] Fetch error:`, fetchError);
        if (fetchError.code === 'PGRST116') {
          throw APIError.notFound(`Student table does not exist: ${fetchError.message}`);
        } else if (fetchError.code === '42501') {
          throw APIError.internal(`Permission denied accessing student table: ${fetchError.message}`);
        } else if (fetchError.code === 'PGRST301') {
          throw APIError.notFound(`Student with ID "${studentIdStr}" not found`);
        } else {
          throw APIError.notFound(`Student not found: ${fetchError.message} (Code: ${fetchError.code})`);
        }
      }

      if (!currentStudent) {
        console.log(`[Student API] No student record found for ID: ${studentIdStr}`);
        throw APIError.notFound("Student record not found");
      }

      console.log(`[Student API] Current student record:`, currentStudent);
      console.log(`[Student API] Available fields in current record:`, Object.keys(currentStudent));

      // Check if trying to remove parentId when one already exists
      const currentParentId = currentStudent.parentid || currentStudent.parent_id || '';
      console.log(`[Student API] Current parent ID: "${currentParentId}"`);
      console.log(`[Student API] New parent ID: "${updateData.parentId}"`);
      
      if (currentParentId && updateData.parentId === '') {
        console.log(`[Student API] Attempting to remove parent ID - this is not allowed`);
        throw APIError.invalidArgument("Cannot remove parent ID from student once assigned. Parent ID is required for all students.");
      }

      // Build the update object with only provided fields
      const updateFields: any = {
        updated_at: new Date().toISOString()
      };

      // Map the fields carefully, checking what fields exist in the current record
      const fieldMappings = [
        { input: 'studentName', dbField: 'studentname', value: updateData.studentName },
        { input: 'grade', dbField: 'grade', value: updateData.grade },
        { input: 'classBuilding', dbField: 'classbuilding', value: updateData.classBuilding },
        { input: 'parentId', dbField: 'parentid', value: updateData.parentId },
        { input: 'studentStatus', dbField: 'studentstatus', value: updateData.studentStatus },
        { input: 'attendanceStatus', dbField: 'attendencestatus', value: updateData.attendanceStatus },
        { input: 'dismissalInstructions', dbField: 'dismissalinstructions', value: updateData.dismissalInstructions },
        { input: 'otherNote', dbField: 'othernote', value: updateData.otherNote }
      ];

      console.log(`[Student API] Processing field mappings...`);
      fieldMappings.forEach(mapping => {
        if (mapping.value !== undefined) {
          console.log(`[Student API] Setting ${mapping.dbField} = "${mapping.value}" (from ${mapping.input})`);
          updateFields[mapping.dbField] = mapping.value;
        }
      });

      console.log(`[Student API] Final update fields:`, updateFields);

      // Validate that we have at least one field to update besides updated_at
      const fieldsToUpdate = Object.keys(updateFields).filter(key => key !== 'updated_at');
      if (fieldsToUpdate.length === 0) {
        console.log(`[Student API] No fields to update`);
        throw APIError.invalidArgument("No fields provided for update");
      }

      console.log(`[Student API] Executing update query...`);
      console.log(`[Student API] Equivalent SQL: UPDATE studentrcd SET ${Object.keys(updateFields).map(k => `${k} = '${updateFields[k]}'`).join(', ')} WHERE studentid = '${studentIdStr}'`);

      // Try multiple update approaches to ensure it works
      let updateSuccess = false;
      let updatedStudentRow = null;
      let updateError = null;

      // Method 1: Standard update with select
      console.log(`[Student API] Attempting Method 1: update().select()`);
      try {
        const { data: updateResult1, error: updateError1 } = await supabase
          .from('studentrcd')
          .update(updateFields)
          .eq('studentid', studentIdStr)
          .select('*')
          .single();

        console.log(`[Student API] Method 1 result:`, { updateResult1, updateError1 });

        if (!updateError1 && updateResult1) {
          updateSuccess = true;
          updatedStudentRow = updateResult1;
          console.log(`[Student API] Method 1 succeeded`);
        } else {
          updateError = updateError1;
          console.log(`[Student API] Method 1 failed:`, updateError1);
        }
      } catch (method1Error) {
        console.error(`[Student API] Method 1 exception:`, method1Error);
        updateError = method1Error;
      }

      // Method 2: Update without select, then fetch separately
      if (!updateSuccess) {
        console.log(`[Student API] Method 1 failed, trying Method 2: update() then select()`);
        try {
          const { error: updateError2 } = await supabase
            .from('studentrcd')
            .update(updateFields)
            .eq('studentid', studentIdStr);

          console.log(`[Student API] Method 2 update result:`, { updateError2 });

          if (!updateError2) {
            // Fetch the updated record
            const { data: fetchResult, error: fetchError2 } = await supabase
              .from('studentrcd')
              .select('*')
              .eq('studentid', studentIdStr)
              .single();

            console.log(`[Student API] Method 2 fetch result:`, { fetchResult, fetchError2 });

            if (!fetchError2 && fetchResult) {
              updateSuccess = true;
              updatedStudentRow = fetchResult;
              console.log(`[Student API] Method 2 succeeded`);
            } else {
              updateError = fetchError2;
              console.log(`[Student API] Method 2 fetch failed:`, fetchError2);
            }
          } else {
            updateError = updateError2;
            console.log(`[Student API] Method 2 update failed:`, updateError2);
          }
        } catch (method2Error) {
          console.error(`[Student API] Method 2 exception:`, method2Error);
          updateError = method2Error;
        }
      }

      // Method 3: Raw SQL approach (if available)
      if (!updateSuccess) {
        console.log(`[Student API] Methods 1 & 2 failed, trying Method 3: raw SQL`);
        try {
          const sqlQuery = `UPDATE studentrcd SET ${Object.keys(updateFields).map(k => `${k} = $${Object.keys(updateFields).indexOf(k) + 1}`).join(', ')} WHERE studentid = $${Object.keys(updateFields).length + 1} RETURNING *`;
          const sqlParams = [...Object.values(updateFields), studentIdStr];
          
          console.log(`[Student API] Raw SQL query:`, sqlQuery);
          console.log(`[Student API] Raw SQL params:`, sqlParams);

          const { data: rawResult, error: rawError } = await supabase
            .rpc('execute_sql', { 
              sql_query: sqlQuery,
              params: sqlParams
            })
            .then(result => result)
            .catch(() => ({ data: null, error: 'Raw SQL not available' }));

          if (!rawError && rawResult && rawResult.length > 0) {
            updateSuccess = true;
            updatedStudentRow = rawResult[0];
            console.log(`[Student API] Method 3 succeeded`);
          } else {
            console.log(`[Student API] Method 3 failed or not available:`, rawError);
          }
        } catch (method3Error) {
          console.error(`[Student API] Method 3 exception:`, method3Error);
        }
      }

      // If all methods failed, throw an error
      if (!updateSuccess) {
        console.error(`[Student API] All update methods failed. Final error:`, updateError);
        
        if (updateError) {
          console.error(`[Student API] Update error code:`, updateError.code);
          console.error(`[Student API] Update error details:`, updateError.details);
          console.error(`[Student API] Update error hint:`, updateError.hint);
          console.error(`[Student API] Update error message:`, updateError.message);
          
          if (updateError.code === 'PGRST116') {
            throw APIError.internal(`Student table does not exist: ${updateError.message}`);
          } else if (updateError.code === '42501') {
            throw APIError.internal(`Permission denied updating student table: ${updateError.message}`);
          } else if (updateError.code === '23505') {
            throw APIError.invalidArgument(`Duplicate value constraint violation: ${updateError.message}`);
          } else if (updateError.code === '23503') {
            throw APIError.invalidArgument(`Foreign key constraint violation: ${updateError.message}`);
          } else if (updateError.code === '23514') {
            throw APIError.invalidArgument(`Check constraint violation: ${updateError.message}`);
          } else if (updateError.code === 'PGRST301') {
            throw APIError.notFound(`Student with ID "${studentIdStr}" not found during update`);
          } else {
            throw APIError.internal(`Failed to update student record: ${updateError.message} (Code: ${updateError.code})`);
          }
        } else {
          throw APIError.internal("Failed to update student record: Unknown error occurred");
        }
      }

      if (!updatedStudentRow) {
        console.error(`[Student API] Update succeeded but no data returned for ID: ${studentIdStr}`);
        throw APIError.internal("Update succeeded but no data returned. This may indicate a database configuration issue.");
      }

      console.log(`[Student API] Successfully updated student data:`, updatedStudentRow);
      console.log(`[Student API] Updated record fields:`, Object.keys(updatedStudentRow));

      // Map the database fields back to our Student interface
      const student: Student = {
        studentId: String(updatedStudentRow.studentid || updatedStudentRow.student_id || ''),
        studentStatus: updatedStudentRow.studentstatus || updatedStudentRow.student_status || 'Active',
        studentName: updatedStudentRow.studentname || updatedStudentRow.student_name || '',
        grade: updatedStudentRow.grade || '',
        classBuilding: updatedStudentRow.classbuilding || updatedStudentRow.class_building || '',
        parentId: updatedStudentRow.parentid || updatedStudentRow.parent_id || '',
        attendanceStatus: updatedStudentRow.attendencestatus || updatedStudentRow.attendance_status || '',
        dismissalInstructions: updatedStudentRow.dismissalinstructions || updatedStudentRow.dismissal_instructions || '',
        otherNote: updatedStudentRow.othernote || updatedStudentRow.other_note || '',
        createdAt: updatedStudentRow.created_at ? new Date(updatedStudentRow.created_at) : new Date(),
        updatedAt: updatedStudentRow.updated_at ? new Date(updatedStudentRow.updated_at) : new Date(),
      };

      console.log(`[Student API] Mapped student response:`, student);
      console.log(`[Student API] === STUDENT UPDATE DEBUG END ===`);
      
      return { student };

    } catch (error) {
      console.error(`[Student API] === STUDENT UPDATE ERROR ===`);
      console.error(`[Student API] Error type:`, typeof error);
      console.error(`[Student API] Error constructor:`, error?.constructor?.name);
      console.error(`[Student API] Full error:`, error);
      
      // Log the error stack if available
      if (error instanceof Error) {
        console.error(`[Student API] Error stack:`, error.stack);
      }
      
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        console.error(`[Student API] Re-throwing APIError:`, error.message);
        throw error;
      }
      
      // Handle any other unexpected errors
      if (error instanceof Error) {
        console.error(`[Student API] Unexpected Error:`, {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Check for specific database errors
        if (error.message.includes('duplicate key')) {
          throw APIError.invalidArgument(`Duplicate value error: ${error.message}`);
        } else if (error.message.includes('foreign key')) {
          throw APIError.invalidArgument(`Foreign key constraint error: ${error.message}`);
        } else if (error.message.includes('check constraint')) {
          throw APIError.invalidArgument(`Check constraint error: ${error.message}`);
        } else if (error.message.includes('permission denied')) {
          throw APIError.internal(`Permission denied: ${error.message}`);
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          throw APIError.internal(`Table does not exist: ${error.message}`);
        } else {
          throw APIError.internal(`Unexpected error during student update: ${error.message}`);
        }
      }
      
      console.error("[Student API] Unknown error type during student update:", error);
      throw APIError.internal("An unknown error occurred while updating student information");
    }
  }
);
