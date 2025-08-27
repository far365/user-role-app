import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Student, GetStudentsByParentResponse } from "./types";

// Retrieves all students associated with a parent ID.
export const getByParentID = api<{ parentID: string }, GetStudentsByParentResponse>(
  { expose: true, method: "GET", path: "/student/by-parent/:parentID" },
  async ({ parentID }) => {
    try {
      console.log(`[Student API] === STUDENT LOOKUP DEBUG ===`);
      console.log(`[Student API] Looking up students for parent ID: "${parentID}"`);
      console.log(`[Student API] Query: SELECT * FROM studentrcd WHERE parentid = '${parentID}'`);
      
      // First, let's see what's in the studentrcd table
      const { data: allStudents, error: allError } = await supabase
        .from('studentrcd')
        .select('*')
        .limit(5);

      console.log(`[Student API] Sample of all students in table:`, allStudents);
      console.log(`[Student API] All students query error:`, allError);

      // Now try the specific query
      const { data: studentRows, error } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', parentID)
        .order('studentname');

      console.log(`[Student API] Specific student query result:`, { 
        studentRows, 
        error,
        rowCount: studentRows?.length || 0 
      });

      if (error) {
        console.log(`[Student API] Student query error:`, error);
        throw APIError.internal(`Failed to fetch students: ${error.message}`);
      }

      // Log the raw data to see what we're working with
      if (studentRows && studentRows.length > 0) {
        console.log(`[Student API] First student raw data:`, studentRows[0]);
        console.log(`[Student API] Available columns:`, Object.keys(studentRows[0]));
      }

      const students: Student[] = (studentRows || []).map((row, index) => {
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
      console.log(`[Student API] Found ${students.length} students for parent ${parentID}`);
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
