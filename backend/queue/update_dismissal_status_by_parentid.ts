import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface UpdateDismissalStatusByParentIdRequest {
  isQrScan: boolean;
  parentId: string;
  dismissalQueueStatus: string;
  addToQueueMethod: string;
  dismissedAt: Date;
  dismissalQrScannedAt: Date;
  alternateName?: string;
  qrScannerId: string;
  userId: string;
}

export interface UpdateDismissalStatusByParentIdResponse {
  success: boolean;
  error?: string;
  result?: any;
}

export const updateDismissalStatusByParentId = api<UpdateDismissalStatusByParentIdRequest, UpdateDismissalStatusByParentIdResponse>(
  { method: "POST", path: "/queue/update-dismissal-status-by-parentid", expose: true },
  async (req): Promise<UpdateDismissalStatusByParentIdResponse> => {
    try {
      const { data, error } = await supabase.rpc('update_dismissal_status_by_parentid', {
        p_is_qr_scan: req.isQrScan,
        p_parentid: req.parentId,
        p_dismissalqueuestatus: req.dismissalQueueStatus,
        p_addtoqueuemethod: req.addToQueueMethod,
        p_dismissedat: req.dismissedAt.toISOString(),
        p_dismissalqrscannedat: req.dismissalQrScannedAt.toISOString(),
        p_alternatename: req.alternateName || null,
        p_qrscannerid: req.qrScannerId,
        p_userid: req.userId
      });

      if (error) {
        console.error("[Queue] Error calling update_dismissal_status_by_parentid:", error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        result: data
      };
    } catch (error) {
      console.error("[Queue] Exception in updateDismissalStatusByParentId:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
);
