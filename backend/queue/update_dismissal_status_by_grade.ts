import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface UpdateDismissalStatusByGradeRequest {
  grade: string;
  dismissalQueueStatus: string;
  addToQueueMethod: string;
  dismissedAt: Date | null;
  userId: string;
}

export interface UpdateDismissalStatusByGradeResponse {
  success: boolean;
  rowsUpdated: number;
  error?: string;
}

export const updateDismissalStatusByGrade = api(
  { method: "POST", path: "/queue/update_dismissal_status_by_grade", expose: true },
  async (req: UpdateDismissalStatusByGradeRequest): Promise<UpdateDismissalStatusByGradeResponse> => {
    try {
      console.log("🚀 UPDATE DISMISSAL STATUS BY GRADE API - Starting request:");
      console.log("  Grade:", req.grade);
      console.log("  Dismissal Queue Status:", req.dismissalQueueStatus);
      console.log("  Add To Queue Method:", req.addToQueueMethod);
      console.log("  Dismissed At:", req.dismissedAt);
      console.log("  User ID:", req.userId);

      const { data, error } = await supabase.rpc('update_dismissal_status_by_grade', {
        p_grade: req.grade,
        p_dismissalqueuestatus: req.dismissalQueueStatus,
        p_addtoqueuemethod: req.addToQueueMethod,
        p_dismissedat: req.dismissedAt ? req.dismissedAt.toISOString() : null,
        p_userid: req.userId
      });

      console.log("📥 UPDATE DISMISSAL STATUS BY GRADE API - Supabase response:");
      console.log("  Data:", data);
      console.log("  Error:", error);

      if (error) {
        console.error("❌ UPDATE DISMISSAL STATUS BY GRADE API - Supabase error:", error);
        return {
          success: false,
          rowsUpdated: 0,
          error: error.message
        };
      }

      const rowsUpdated = typeof data === 'number' ? data : 0;
      
      console.log("✅ UPDATE DISMISSAL STATUS BY GRADE API - Success:");
      console.log("  Rows updated:", rowsUpdated);

      return {
        success: true,
        rowsUpdated: rowsUpdated
      };

    } catch (error) {
      console.error("💥 UPDATE DISMISSAL STATUS BY GRADE API - Unexpected error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        rowsUpdated: 0,
        error: errorMessage
      };
    }
  }
);
