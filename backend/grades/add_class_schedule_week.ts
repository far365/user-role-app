import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { AddClassScheduleWeekRequest, AddClassScheduleWeekResponse } from "./types";

export const addClassScheduleWeek = api(
  { method: "POST", path: "/grades/class-schedule-week", expose: true },
  async (req: AddClassScheduleWeekRequest): Promise<AddClassScheduleWeekResponse> => {
    const { ayid, effective_date, grade, week_schedule } = req;

    if (!ayid || !effective_date || !grade) {
      throw APIError.invalidArgument("Missing required fields: ayid, effective_date, or grade");
    }

    if (!Array.isArray(week_schedule) || week_schedule.length === 0) {
      throw APIError.invalidArgument("week_schedule must be a non-empty array");
    }

    const [year, month, day] = effective_date.split('-').map(Number);
    const effectiveDateObj = new Date(year, month - 1, day);
    
    if (effectiveDateObj.getDay() !== 1) {
      throw APIError.invalidArgument("effective_date must be a Monday");
    }

    const dayOfWeekSet = new Set<string>();
    for (const activity of week_schedule) {
      if (!activity.day_of_week) {
        throw APIError.invalidArgument("Each activity must have a day_of_week");
      }
      if (dayOfWeekSet.has(activity.day_of_week)) {
        throw APIError.invalidArgument(`Duplicate day_of_week found: ${activity.day_of_week}`);
      }
      dayOfWeekSet.add(activity.day_of_week);
    }

    const { data, error } = await supabase.rpc("add_class_schedule_week", {
      p_ayid: ayid,
      p_effective_date: effective_date,
      p_grade: grade,
      p_week_schedule: week_schedule,
    });

    if (error) {
      console.error("Failed to insert week class schedule:", error);
      throw APIError.internal(`Failed to save week class schedule: ${error.message}`);
    }

    return {
      success: true,
      message: `Successfully saved ${week_schedule.length} day schedules for grade ${grade}`,
    };
  }
);
