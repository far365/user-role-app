import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

export const debugParentQueueData = api(
  { method: "POST", path: "/queue/debug-parent-queue-data", expose: true },
  async ({ parentId }: { parentId: string }) => {
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
