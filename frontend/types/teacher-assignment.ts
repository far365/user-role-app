export type TeacherRole = "Primary Teacher" | "Assistant Teacher" | "Substitute Teacher" | "Student Teacher";

export type AssignmentType = "Permanent" | "Temporary";

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  qualifications?: string[];
}

export interface ScheduleActivity {
  id: string;
  activity_name: string;
  activity_type: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  grade: string;
  required_teachers: {
    primary: number;
    assistant: number;
    student_teacher: number;
  };
}

export interface TeacherAssignment {
  id: string;
  activity_id: string;
  teacher_id: string;
  teacher_name: string;
  role: TeacherRole;
  assignment_type: AssignmentType;
  start_date: string;
  end_date?: string;
  replacing_teacher_id?: string;
  replacing_teacher_name?: string;
  assigned_by: string;
  assigned_at: string;
  notes?: string;
}

export interface TeacherWorkload {
  teacher_id: string;
  teacher_name: string;
  total_hours_per_week: number;
  assignments: TeacherAssignment[];
  conflicts: Conflict[];
}

export interface Conflict {
  type: "time_overlap" | "over_capacity" | "unavailable";
  message: string;
  activity_ids: string[];
}

export interface TeacherAvailability {
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string;
}
