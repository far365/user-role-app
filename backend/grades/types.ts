export interface Grade {
  name: string;
  building: string;
  sortOrder: number;
}

export interface ListGradesResponse {
  grades: Grade[];
}

export interface ScheduleActivity {
  activity_name: string;
  activity_type: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  notes?: string;
}

export interface ScheduleHeader {
  timezone: string;
  ayid: string;
  grade: string;
  day_of_week: string;
  effective_date: string;
  start_time: string;
}

export interface AddClassScheduleRequest {
  header: ScheduleHeader;
  activities: ScheduleActivity[];
}

export interface AddClassScheduleResponse {
  success: boolean;
  message: string;
  schedule_id?: string;
}

export interface GetClassScheduleByGradeRequest {
  timezone: string;
  ayid: string;
  grade: string;
}

export interface GetClassScheduleByGradeResponse {
  schedule: any[];
}
