import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface StudentByGradeResponse {
  studentid: number;
  studentname: string;
  grade: string;
  classbuilding: string;
  parentid: string;
  parentname: string;
}

export const getStudentsByGrade = api<{ grade: string }, { students: StudentByGradeResponse[] }>(
  { expose: true, method: "GET", path: "/student/get-by-grade/:grade" },
  async ({ grade }) => {
    try {
      const { data, error } = await supabase
        .rpc('get_students_by_grade', { p_grade: grade });

      if (error) {
        console.error("[Student API] Supabase function error:", error);
        throw APIError.internal(`Failed to fetch students by grade: ${error.message}`);
      }

      if (!data) {
        return { students: [] };
      }

      const students: StudentByGradeResponse[] = data.map((row: any) => ({
        studentid: Number(row.studentid),
        studentname: row.studentname,
        grade: row.grade,
        classbuilding: row.classbuilding,
        parentid: row.parentid,
        parentname: row.parentname,
      }));

      return { students };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Student API] Unexpected error calling Supabase function:", error);
      throw APIError.internal("Failed to fetch students by grade");
    }
  }
);
