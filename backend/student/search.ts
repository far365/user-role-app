import { api, APIError, Query } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Student } from "./types";

export interface SearchStudentByNameRequest {
  name: Query<string>;
}

export interface SearchStudentByIdRequest {
  studentId: Query<string>;
}

export interface SearchStudentByGradeRequest {
  grade: Query<string>;
}

export interface SearchStudentResponse {
  students: Student[];
}

// Searches for student records by student name (minimum 3 characters).
export const searchByName = api<SearchStudentByNameRequest, SearchStudentResponse>(
  { expose: true, method: "GET", path: "/student/search/name" },
  async ({ name }) => {
    if (!name || name.trim().length < 3) {
      throw APIError.invalidArgument("Name must be at least 3 characters long");
    }

    try {
      console.log(`[Student Search] Searching by name: "${name}"`);
      
      const { data: studentRows, error } = await supabase
        .from('studentrcd')
        .select('*')
        .ilike('studentname', `%${name.trim()}%`)
        .order('studentname');

      console.log(`[Student Search] Query result:`, { studentRows, error });

      if (error) {
        console.error("Search by name error:", error);
        throw APIError.internal(`Failed to search students: ${error.message}`);
      }

      const students: Student[] = (studentRows || []).map(row => ({
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
      }));

      console.log(`[Student Search] Found ${students.length} students`);
      return { students };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error searching students by name:", error);
      throw APIError.internal("Failed to search student records");
    }
  }
);

// Searches for student records by student ID (exact match).
export const searchById = api<SearchStudentByIdRequest, SearchStudentResponse>(
  { expose: true, method: "GET", path: "/student/search/id" },
  async ({ studentId }) => {
    if (!studentId || studentId.trim().length === 0) {
      throw APIError.invalidArgument("Student ID is required");
    }

    try {
      console.log(`[Student Search] Searching by ID: "${studentId}"`);
      
      const { data: studentRows, error } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('studentid', studentId.trim())
        .order('studentname');

      console.log(`[Student Search] Query result:`, { studentRows, error });

      if (error) {
        console.error("Search by ID error:", error);
        throw APIError.internal(`Failed to search students: ${error.message}`);
      }

      const students: Student[] = (studentRows || []).map(row => ({
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
      }));

      console.log(`[Student Search] Found ${students.length} students`);
      return { students };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error searching students by ID:", error);
      throw APIError.internal("Failed to search student records");
    }
  }
);

// Searches for student records by grade.
export const searchByGrade = api<SearchStudentByGradeRequest, SearchStudentResponse>(
  { expose: true, method: "GET", path: "/student/search/grade" },
  async ({ grade }) => {
    if (!grade || grade.trim().length === 0) {
      throw APIError.invalidArgument("Grade is required");
    }

    try {
      console.log(`[Student Search] Searching by grade: "${grade}"`);
      
      const { data: studentRows, error } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('grade', grade.trim())
        .order('studentname');

      console.log(`[Student Search] Query result:`, { studentRows, error });

      if (error) {
        console.error("Search by grade error:", error);
        throw APIError.internal(`Failed to search students: ${error.message}`);
      }

      const students: Student[] = (studentRows || []).map(row => ({
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
      }));

      console.log(`[Student Search] Found ${students.length} students`);
      return { students };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error searching students by grade:", error);
      throw APIError.internal("Failed to search student records");
    }
  }
);
