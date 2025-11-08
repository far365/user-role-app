import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface AttendanceDismissalRecord {
  queueid: string;
  studentid: string;
  StudentName: string;
  AttendanceStatusAndTime: string;
  DismissalStatusAndTime: string;
  DismissalMethod: string;
  DismissalPickupBy: string;
}

interface DebugParentQueueDataResponse {
  parentId: string;
  students?: AttendanceDismissalRecord[];
  rpcResult?: AttendanceDismissalRecord[];
  rpcError: any;
  queueItems?: AttendanceDismissalRecord[];
  message: string;
  error?: string;
  stack?: string;
}

export const debugParentQueueData = api(
  { method: "POST", path: "/queue/debug-parent-queue-data", expose: true },
  async ({ parentId }: { parentId: string }): Promise<DebugParentQueueDataResponse> => {
    console.log(`=== DEBUG PARENT QUEUE DATA ===`);
    console.log(`Parent ID: ${parentId}`);
    
    try {
      // Test RPC call first (this works)
      const rpcTest = await supabase.rpc('get_attendance_dismissal_status_by_parent', { 
        sch_tz: 'America/Chicago', 
        p_parentid: parentId 
      });
      
      console.log(`RPC Test Result:`, rpcTest);
      
      return {
        parentId,
        students: rpcTest.data,
        rpcResult: rpcTest.data,
        rpcError: rpcTest.error,
        queueItems: rpcTest.data,
        message: 'Using RPC instead of direct queries'
      };
    } catch (err) {
      console.error(`Exception:`, err);
      return {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      };
    }
  }
);
