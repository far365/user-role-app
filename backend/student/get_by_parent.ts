import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Student, GetStudentsByParentResponse } from "./types";

// Retrieves all students associated with a parent ID.
export const getByParentID = api<{ parentID: string }, GetStudentsByParentResponse>(
  { expose: true, method: "GET", path: "/student/by-parent/:parentID" },
  async ({ parentID }) => {
    try {
      console.log(`[Student API] Looking up students for parent ID: ${parentID}`);
      
      const { data: studentRows, error } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', parentID)
        .order('studentname');

      console.log(`[Student API] Student query result:`, { studentRows, error });

      if (error) {
        console.log(`[Student API] Student query error:`, error);
        throw APIError.internal(`Failed to fetch students: ${error.message}`);
      }

      const students: Student[] = (studentRows || []).map(row => ({
        studentID: row.studentid || row.student_id || '',
        parentID: row.parentid || row.parent_id || '',
        studentName: row.studentname || row.student_name || '',
        grade: row.grade || '',
        class: row.class || row.classname || '',
        studentStatus: row.studentstatus || row.student_status || 'Active',
        dateOfBirth: row.dateofbirth || row.date_of_birth ? new Date(row.dateofbirth || row.date_of_birth) : undefined,
        emergencyContact: row.emergencycontact || row.emergency_contact || '',
        medicalInfo: row.medicalinfo || row.medical_info || '',
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));

      console.log(`[Student API] Found ${students.length} students for parent ${parentID}`);
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
