import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Student, GetStudentsByParentResponse } from "./types";

// Retrieves all students associated with a parent ID.
export const getByParentID = api<{ parentID: string }, GetStudentsByParentResponse>(
  { expose: true, method: "GET", path: "/student/by-parent/:parentID" },
  async ({ parentID }) => {
    try {
      console.log(`[Student API] === ENHANCED SUPABASE STUDENT LOOKUP DEBUG ===`);
      console.log(`[Student API] Looking up students for parent ID: "${parentID}"`);
      console.log(`[Student API] Using Supabase client to query: SELECT * FROM studentrcd WHERE parentid = '${parentID}'`);
      
      // Enhanced Test 1: Verify Supabase connection and configuration
      console.log(`[Student API] Testing Supabase connection...`);
      try {
        // Verify Supabase client is properly configured
        console.log(`[Student API] Supabase URL configured: ${supabase.supabaseUrl ? 'YES' : 'NO'}`);
        console.log(`[Student API] Supabase Key configured: ${supabase.supabaseKey ? 'YES' : 'NO'}`);
        console.log(`[Student API] Supabase REST URL: ${supabase.rest?.url || 'NOT_AVAILABLE'}`);
        
        const { data: connectionTest, error: connectionError } = await supabase
          .from('usersrcd')
          .select('count')
          .limit(1);
        
        if (connectionError) {
          console.error(`[Student API] Supabase connection failed:`, connectionError);
          throw APIError.internal(`Supabase connection failed: ${connectionError.message}`);
        }
        
        console.log(`[Student API] Supabase connection: OK`);
      } catch (connErr) {
        console.error(`[Student API] Supabase connection test failed:`, connErr);
        throw APIError.internal("Supabase database connection failed");
      }

      // Enhanced Test 2: Check if studentrcd table is accessible in Supabase
      console.log(`[Student API] Testing studentrcd table access in Supabase...`);
      try {
        const { error: tableTestError } = await supabase
          .from('studentrcd')
          .select('*')
          .limit(0);
        
        if (tableTestError) {
          console.error(`[Student API] Supabase table access error:`, tableTestError);
          console.error(`[Student API] Error code: ${tableTestError.code}`);
          console.error(`[Student API] Error details: ${tableTestError.details}`);
          console.error(`[Student API] Error hint: ${tableTestError.hint}`);
          
          if (tableTestError.code === 'PGRST116') {
            throw APIError.internal(`Table 'studentrcd' does not exist in Supabase database`);
          } else if (tableTestError.code === '42501') {
            throw APIError.internal(`Permission denied: Cannot access 'studentrcd' table in Supabase. Check RLS policies.`);
          } else {
            throw APIError.internal(`Cannot access studentrcd table in Supabase: ${tableTestError.message}`);
          }
        }
        console.log(`[Student API] Supabase table access: OK`);
      } catch (tableErr) {
        console.error(`[Student API] Supabase table access failed:`, tableErr);
        if (tableErr instanceof APIError) {
          throw tableErr;
        }
        throw APIError.internal("Cannot access studentrcd table in Supabase");
      }

      // Enhanced Test 3: Get total count of records in studentrcd from Supabase
      console.log(`[Student API] Checking total records in studentrcd table in Supabase...`);
      const { count: totalStudentCount, error: countError } = await supabase
        .from('studentrcd')
        .select('*', { count: 'exact', head: true });

      console.log(`[Student API] Total students in Supabase table: ${totalStudentCount || 0}`);
      if (countError) {
        console.log(`[Student API] Supabase count error:`, countError);
      }

      // Enhanced Test 4: Get sample of all students with detailed logging
      console.log(`[Student API] Fetching sample of all students from Supabase...`);
      const { data: allStudents, error: allError } = await supabase
        .from('studentrcd')
        .select('*')
        .limit(10);

      console.log(`[Student API] Sample students query result from Supabase:`, {
        recordCount: allStudents?.length || 0,
        error: allError?.message || null,
        errorCode: allError?.code || null,
        sampleRecords: allStudents || []
      });

      if (allStudents && allStudents.length > 0) {
        console.log(`[Student API] First student record structure from Supabase:`, Object.keys(allStudents[0]));
        console.log(`[Student API] First student data from Supabase:`, allStudents[0]);
        
        // Check if any students have the parentid we're looking for
        const matchingStudents = allStudents.filter(s => s.parentid === parentID);
        console.log(`[Student API] Students with parentid '${parentID}' in Supabase sample:`, matchingStudents.length);
        if (matchingStudents.length > 0) {
          console.log(`[Student API] Matching students found in Supabase sample:`, matchingStudents);
        }
      } else {
        console.log(`[Student API] ⚠️  CRITICAL: studentrcd table in Supabase appears to be empty!`);
        console.log(`[Student API] This explains why no students are found for parent ${parentID}`);
        console.log(`[Student API] Please check:`);
        console.log(`[Student API] 1. Is data actually in the studentrcd table in your Supabase database?`);
        console.log(`[Student API] 2. Are there any RLS (Row Level Security) policies in Supabase blocking access?`);
        console.log(`[Student API] 3. Is the API using the correct Supabase project and credentials?`);
        console.log(`[Student API] 4. Check the Supabase dashboard to verify the table exists and has data`);
      }

      // Enhanced Test 5: Try the specific query with multiple approaches
      console.log(`[Student API] Attempting specific parent query in Supabase with multiple approaches...`);
      
      // Approach 1: Standard .eq()
      const { data: studentRows1, error: error1 } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', parentID);

      console.log(`[Student API] Supabase Approach 1 (.eq): ${studentRows1?.length || 0} records, error: ${error1?.message || 'none'}`);
      if (error1) {
        console.log(`[Student API] Supabase error1 details:`, { code: error1.code, details: error1.details, hint: error1.hint });
      }

      // Approach 2: .filter()
      const { data: studentRows2, error: error2 } = await supabase
        .from('studentrcd')
        .select('*')
        .filter('parentid', 'eq', parentID);

      console.log(`[Student API] Supabase Approach 2 (.filter): ${studentRows2?.length || 0} records, error: ${error2?.message || 'none'}`);
      if (error2) {
        console.log(`[Student API] Supabase error2 details:`, { code: error2.code, details: error2.details, hint: error2.hint });
      }

      // Use the first successful approach
      const studentRows = studentRows1 || studentRows2 || [];
      const error = error1 || error2;

      console.log(`[Student API] Final Supabase query result:`, { 
        studentRows: studentRows.length, 
        error: error?.message || null,
        errorCode: error?.code || null,
        rowCount: studentRows?.length || 0 
      });

      if (error) {
        console.log(`[Student API] Supabase student query error:`, error);
        throw APIError.internal(`Failed to fetch students from Supabase: ${error.message}`);
      }

      // Check if we got any results
      if (!studentRows) {
        console.log(`[Student API] No student rows returned from Supabase (null result)`);
        return { students: [] };
      }

      if (studentRows.length === 0) {
        console.log(`[Student API] No students found in Supabase for parent ID: ${parentID}`);
        console.log(`[Student API] This could be because:`);
        console.log(`[Student API] 1. No student records exist in Supabase with parentid = '${parentID}'`);
        console.log(`[Student API] 2. The studentrcd table in Supabase is empty (as shown above)`);
        console.log(`[Student API] 3. RLS policies in Supabase are blocking access to the data`);
        console.log(`[Student API] 4. The parentid field values in Supabase don't match the expected format`);
        return { students: [] };
      }

      // Log the raw data to see what we're working with
      console.log(`[Student API] Found ${studentRows.length} students in Supabase! Processing...`);
      console.log(`[Student API] First student raw data from Supabase:`, studentRows[0]);
      console.log(`[Student API] Available columns from Supabase:`, Object.keys(studentRows[0]));

      const students: Student[] = studentRows.map((row, index) => {
        console.log(`[Student API] Processing Supabase student ${index + 1}:`, row);
        
        const student = {
          studentId: String(row.studentid || row.student_id || ''),
          studentStatus: row.studentstatus || row.student_status || 'Active',
          studentName: row.studentname || row.student_name || '',
          grade: row.grade || '',
          classBuilding: row.classbuilding || row.class_building || '',
          parentId: row.parentid || row.parent_id || '',
          attendanceStatus: row.attendencestatus || row.attendance_status || '',
          dismissalInstructions: row.dismissalinstructions || row.dismissal_instructions || '',
          otherNote: row.othernote || row.other_note || '',
          createdAt: row.created_at ? new Date(row.created_at) : new Date(),
          updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };
        
        console.log(`[Student API] Mapped Supabase student ${index + 1}:`, student);
        return student;
      });

      console.log(`[Student API] === FINAL SUPABASE RESULT ===`);
      console.log(`[Student API] Successfully found ${students.length} students in Supabase for parent ${parentID}`);
      console.log(`[Student API] Students from Supabase:`, students);
      
      return { students };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Student API] Unexpected error fetching student data from Supabase:", error);
      throw APIError.internal("Failed to fetch student information from Supabase");
    }
  }
);
