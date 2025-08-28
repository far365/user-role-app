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

    try {
      console.log(`[Student API] Updating student data for ID: ${studentId}`);
      console.log(`[Student API] Update data:`, updateData);
      
      // First, get the current student record to check if parentId is being changed
      const { data: currentStudent, error: fetchError } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('studentid', studentId)
        .single();

      if (fetchError) {
        console.log(`[Student API] Fetch error:`, fetchError);
        throw APIError.notFound(`Student not found: ${fetchError.message}`);
      }

      if (!currentStudent) {
        throw APIError.notFound("Student record not found");
      }

      // Check if trying to remove parentId when one already exists
      const currentParentId = currentStudent.parentid || currentStudent.parent_id || '';
      if (currentParentId && updateData.parentId === '') {
        throw APIError.invalidArgument("Cannot remove parent ID from student once assigned. Parent ID is required for all students.");
      }

      // Build the update object with only provided fields
      const updateFields: any = {
        updated_at: new Date().toISOString()
      };

      if (updateData.studentName !== undefined) {
        updateFields.studentname = updateData.studentName;
      }
      if (updateData.grade !== undefined) {
        updateFields.grade = updateData.grade;
      }
      if (updateData.classBuilding !== undefined) {
        updateFields.classbuilding = updateData.classBuilding;
      }
      if (updateData.parentId !== undefined) {
        updateFields.parentid = updateData.parentId;
      }
      if (updateData.studentStatus !== undefined) {
        updateFields.studentstatus = updateData.studentStatus;
      }
      if (updateData.attendanceStatus !== undefined) {
        updateFields.attendencestatus = updateData.attendanceStatus;
      }
      if (updateData.dismissalInstructions !== undefined) {
        updateFields.dismissalinstructions = updateData.dismissalInstructions;
      }
      if (updateData.otherNote !== undefined) {
        updateFields.othernote = updateData.otherNote;
      }

      console.log(`[Student API] Final update fields:`, updateFields);

      // Update the student record
      const { data: updatedStudentRow, error: updateError } = await supabase
        .from('studentrcd')
        .update(updateFields)
        .eq('studentid', studentId)
        .select('*')
        .single();

      console.log(`[Student API] Update result:`, { updatedStudentRow, updateError });

      if (updateError) {
        console.log(`[Student API] Update error:`, updateError);
        throw APIError.internal(`Failed to update student record: ${updateError.message}`);
      }

      if (!updatedStudentRow) {
        console.log(`[Student API] No student row returned after update for ID: ${studentId}`);
        throw APIError.notFound("Student record not found");
      }

      console.log(`[Student API] Successfully updated student data:`, updatedStudentRow);

      const student: Student = {
        studentId: updatedStudentRow.studentid || updatedStudentRow.student_id || '',
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

      console.log(`[Student API] Returning updated student data:`, student);
      return { student };

    } catch (error) {
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        console.log(`[Student API] APIError:`, error.message);
        throw error;
      }
      
      console.error("[Student API] Unexpected error updating student data:", error);
      throw APIError.internal("Failed to update student information");
    }
  }
);
