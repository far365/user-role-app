import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { AddClassScheduleRequest, AddClassScheduleResponse } from "./types";

export const addClassSchedule = api(
  { method: "POST", path: "/grades/class-schedule", expose: true },
  async (req: AddClassScheduleRequest): Promise<AddClassScheduleResponse> => {
    const { header, activities } = req;

    if (!header.grade || !header.ayid || !header.effective_date) {
      throw APIError.invalidArgument("Missing required header fields");
    }

    if (!activities || activities.length === 0) {
      throw APIError.invalidArgument("At least one activity is required");
    }

    const effectiveDate = new Date(header.effective_date);
    if (effectiveDate.getDay() !== 1) {
      throw APIError.invalidArgument("Effective date must be a Monday");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    effectiveDate.setHours(0, 0, 0, 0);
    if (effectiveDate <= today) {
      throw APIError.invalidArgument("Effective date must be in the future");
    }

    const scheduleData = activities.map((activity) => ({
      ayid: header.ayid,
      grade: header.grade,
      day_of_week: activity.day_of_week,
      activity_name: activity.activity_name,
      activity_type: activity.activity_type,
      start_time: activity.start_time,
      end_time: activity.end_time,
      effective_date: header.effective_date,
      timezone: header.timezone,
      notes: activity.notes || null,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("class_schedules")
      .insert(scheduleData)
      .select();

    if (error) {
      console.error("Failed to insert class schedule:", error);
      throw APIError.internal(`Failed to save class schedule: ${error.message}`);
    }

    return {
      success: true,
      message: `Successfully saved ${activities.length} activities for grade ${header.grade}`,
      schedule_id: data?.[0]?.id,
    };
  }
);
