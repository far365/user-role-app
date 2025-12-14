export interface AcademicYear {
  ayid: string;
  start_date: string;
  end_date: string;
}

export interface CourseSetup {
  course_code: string;
  course_name: string;
  subject: string;
  grade: string;
  credits: number;
  term: string;
  color_scheme: string;
  max_enrollment: number;
  min_teachers: number;
  min_assistants: number;
  description: string | null;
  created_at: string;
}
