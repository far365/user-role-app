import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface StudentByGroupIdResponse {
  studentid: number;
  studentname: string;
  grade: string;
  classbuilding: string;
  parentid: string;
  parentname: string;
  groupid: number;
}

export const getStudentsByGroupId = api<{ groupid: string }, { students: StudentByGroupIdResponse[] }>(
  { expose: true, method: "GET", path: "/student/get-by-groupid/:groupid" },
  async ({ groupid }) => {
    try {
      const { data, error } = await supabase
        .rpc('get_students_by_groupid', { p_groupid: groupid });

      if (error) {
        console.error("[Student API] Supabase function error:", error);
        throw APIError.internal(`Failed to fetch students by groupid: ${error.message}`);
      }

      if (!data) {
        return { students: [] };
      }

      const students: StudentByGroupIdResponse[] = data.map((row: any) => ({
        studentid: Number(row.studentid),
        studentname: row.studentname,
        grade: row.grade,
        classbuilding: row.classbuilding,
        parentid: row.parentid,
        parentname: row.parentname,
        groupid: Number(row.groupid),
      }));

      return { students };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Student API] Unexpected error calling Supabase function:", error);
      throw APIError.internal("Failed to fetch students by groupid");
    }
  }
);
