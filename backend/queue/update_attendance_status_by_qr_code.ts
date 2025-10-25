import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface UpdateAttendanceStatusByQRCodeRequest {
  studentId: string;
  userId: string;
}

export interface UpdateAttendanceStatusByQRCodeResponse {
  success: boolean;
  data: any;
}

export const updateAttendanceStatusByQRCode = api<UpdateAttendanceStatusByQRCodeRequest, UpdateAttendanceStatusByQRCodeResponse>(
  { expose: true, method: "PUT", path: "/queue/update-attendance-status-by-qr-code" },
  async (req) => {
    const { studentId, userId } = req;

    if (!studentId || !studentId.trim()) {
      throw APIError.invalidArgument("Student ID is required");
    }

    if (!userId || !userId.trim()) {
      throw APIError.invalidArgument("User ID is required");
    }

    try {
      const { data, error } = await supabase.rpc('update_attendance_status_by_qrcode', {
        p_studentid: studentId.trim(),
        p_userid: userId.trim()
      });

      if (error) {
        console.error("[Queue API] Error updating attendance status by QR code:", error);
        throw APIError.internal(`Failed to update attendance status: ${error.message}`);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error) {
        console.error("[Queue API] Unexpected error:", error);
        throw APIError.internal(`Unexpected error: ${error.message}`);
      }

      throw APIError.internal("An unknown error occurred while updating attendance status");
    }
  }
);
