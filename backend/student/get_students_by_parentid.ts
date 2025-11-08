import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface StudentResponse {
  studentid: string;
  studentname: string;
  grade: string;
  classbuilding: string;
  parentid: string;
  dismissalinstructions: string;
  othernote: string;
  updated_at: Date;
}

export const getStudentsByParentID = api<{ parentId: string }, { students: StudentResponse[] }>(
  { expose: true, method: "GET", path: "/student/get-by-parentid/:parentId" },
  async ({ parentId }) => {
    try {
      const { data, error } = await supabase
        .rpc('get_students_by_parentid', { parent_id: parentId });

      if (error) {
        console.error("[Student API] Supabase function error:", error);
        throw APIError.internal(`Failed to fetch students: ${error.message}`);
      }

      if (!data) {
        return { students: [] };
      }

      const students: StudentResponse[] = data.map((row: any) => ({
        studentid: row.studentid,
        studentname: row.studentname,
        grade: row.grade,
        classbuilding: row.classbuilding,
        parentid: row.parentid,
        dismissalinstructions: row.dismissalinstructions || '',
        othernote: row.othernote || '',
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));

      return { students };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Student API] Unexpected error calling Supabase function:", error);
      throw APIError.internal("Failed to fetch student information");
    }
  }
);
