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

    const dayOfWeekMap: { [key: string]: number } = {
      "Sunday": 0,
      "Monday": 1,
      "Tuesday": 2,
      "Wednesday": 3,
      "Thursday": 4,
      "Friday": 5,
      "Saturday": 6,
    };

    const effectiveDate = new Date(header.effective_date);
    const expectedDay = dayOfWeekMap[header.day_of_week];
    
    if (expectedDay === undefined) {
      throw APIError.invalidArgument(`Invalid day_of_week: ${header.day_of_week}`);
    }

    if (effectiveDate.getDay() !== expectedDay) {
      throw APIError.invalidArgument(`Effective date must be a ${header.day_of_week}`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    effectiveDate.setHours(0, 0, 0, 0);
    if (effectiveDate <= today) {
      throw APIError.invalidArgument("Effective date must be in the future");
    }

    const payload = {
      header,
      activities,
    };

    const jsonPayload = JSON.stringify(payload);

    const { data, error } = await supabase.rpc("add_class_schedule", {
      json_input: jsonPayload,
    });

    if (error) {
      console.error("Failed to insert class schedule:", error);
      throw APIError.internal(`Failed to save class schedule: ${error.message}`);
    }

    return {
      success: true,
      message: `Successfully saved ${activities.length} activities for grade ${header.grade}`,
      schedule_id: data?.schedule_id,
    };
  }
);
