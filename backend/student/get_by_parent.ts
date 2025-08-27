import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Student, GetStudentsByParentResponse } from "./types";

// Retrieves all students associated with a parent ID.
export const getByParentID = api<{ parentID: string }, GetStudentsByParentResponse>(
  { expose: true, method: "GET", path: "/student/by-parent/:parentID" },
  async ({ parentID }) => {
    try {
      console.log(`[Student API] === ENHANCED STUDENT LOOKUP DEBUG ===`);
      console.log(`[Student API] Looking up students for parent ID: "${parentID}"`);
      console.log(`[Student API] Query: SELECT * FROM studentrcd WHERE parentid = '${parentID}'`);
      
      // Enhanced Test 1: Check database connection
      console.log(`[Student API] Testing database connection...`);
      try {
        const { data: connectionTest } = await supabase
          .from('usersrcd')
          .select('count')
          .limit(1);
        console.log(`[Student API] Database connection: OK`);
      } catch (connErr) {
        console.error(`[Student API] Database connection failed:`, connErr);
        throw APIError.internal("Database connection failed");
      }

      // Enhanced Test 2: Check if studentrcd table is accessible
      console.log(`[Student API] Testing studentrcd table access...`);
      try {
        const { error: tableTestError } = await supabase
          .from('studentrcd')
          .select('*')
          .limit(0);
        
        if (tableTestError) {
          console.error(`[Student API] Table access error:`, tableTestError);
          throw APIError.internal(`Cannot access studentrcd table: ${tableTestError.message}`);
        }
        console.log(`[Student API] Table access: OK`);
      } catch (tableErr) {
        console.error(`[Student API] Table access failed:`, tableErr);
        throw APIError.internal("Cannot access studentrcd table");
      }

      // Enhanced Test 3: Get total count of records in studentrcd
      console.log(`[Student API] Checking total records in studentrcd table...`);
      const { count: totalStudentCount, error: countError } = await supabase
        .from('studentrcd')
        .select('*', { count: 'exact', head: true });

      console.log(`[Student API] Total students in table: ${totalStudentCount || 0}`);
      if (countError) {
        console.log(`[Student API] Count error:`, countError);
      }

      // Enhanced Test 4: Get sample of all students with detailed logging
      console.log(`[Student API] Fetching sample of all students...`);
      const { data: allStudents, error: allError } = await supabase
        .from('studentrcd')
        .select('*')
        .limit(10);

      console.log(`[Student API] Sample students query result:`, {
        recordCount: allStudents?.length || 0,
        error: allError?.message || null,
        sampleRecords: allStudents || []
      });

      if (allStudents && allStudents.length > 0) {
        console.log(`[Student API] First student record structure:`, Object.keys(allStudents[0]));
        console.log(`[Student API] First student data:`, allStudents[0]);
        
        // Check if any students have the parentid we're looking for
        const matchingStudents = allStudents.filter(s => s.parentid === parentID);
        console.log(`[Student API] Students with parentid '${parentID}' in sample:`, matchingStudents.length);
        if (matchingStudents.length > 0) {
          console.log(`[Student API] Matching students found in sample:`, matchingStudents);
        }
      } else {
        console.log(`[Student API] ⚠️  CRITICAL: studentrcd table appears to be empty!`);
        console.log(`[Student API] This explains why no students are found for parent ${parentID}`);
        console.log(`[Student API] Please check:`);
        console.log(`[Student API] 1. Is data actually in the studentrcd table?`);
        console.log(`[Student API] 2. Is the API connecting to the correct database?`);
        console.log(`[Student API] 3. Are there any RLS (Row Level Security) policies blocking access?`);
      }

      // Enhanced Test 5: Try the specific query with multiple approaches
      console.log(`[Student API] Attempting specific parent query with multiple approaches...`);
      
      // Approach 1: Standard .eq()
      const { data: studentRows1, error: error1 } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', parentID);

      console.log(`[Student API] Approach 1 (.eq): ${studentRows1?.length || 0} records, error: ${error1?.message || 'none'}`);

      // Approach 2: .filter()
      const { data: studentRows2, error: error2 } = await supabase
        .from('studentrcd')
        .select('*')
        .filter('parentid', 'eq', parentID);

      console.log(`[Student API] Approach 2 (.filter): ${studentRows2?.length || 0} records, error: ${error2?.message || 'none'}`);

      // Use the first successful approach
      const studentRows = studentRows1 || studentRows2 || [];
      const error = error1 || error2;

      console.log(`[Student API] Final query result:`, { 
        studentRows: studentRows.length, 
        error: error?.message || null,
        rowCount: studentRows?.length || 0 
      });

      if (error) {
        console.log(`[Student API] Student query error:`, error);
        throw APIError.internal(`Failed to fetch students: ${error.message}`);
      }

      // Check if we got any results
      if (!studentRows) {
        console.log(`[Student API] No student rows returned (null result)`);
        return { students: [] };
      }

      if (studentRows.length === 0) {
        console.log(`[Student API] No students found for parent ID: ${parentID}`);
        console.log(`[Student API] This could be because:`);
        console.log(`[Student API] 1. No student records exist with parentid = '${parentID}'`);
        console.log(`[Student API] 2. The studentrcd table is empty (as shown above)`);
        console.log(`[Student API] 3. There's a data mismatch between your direct SQL and this API`);
        return { students: [] };
      }

      // Log the raw data to see what we're working with
      console.log(`[Student API] Found ${studentRows.length} students! Processing...`);
      console.log(`[Student API] First student raw data:`, studentRows[0]);
      console.log(`[Student API] Available columns:`, Object.keys(studentRows[0]));

      const students: Student[] = studentRows.map((row, index) => {
        console.log(`[Student API] Processing student ${index + 1}:`, row);
        
        const student = {
          studentId: row.studentid || row.student_id || '',
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
        
        console.log(`[Student API] Mapped student ${index + 1}:`, student);
        return student;
      });

      console.log(`[Student API] === FINAL RESULT ===`);
      console.log(`[Student API] Successfully found ${students.length} students for parent ${parentID}`);
      console.log(`[Student API] Students:`, students);
      
      return { students };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Student API] Unexpected error fetching student data:", error);
      throw APIError.internal("Failed to fetch student information");
    }
  }
);
