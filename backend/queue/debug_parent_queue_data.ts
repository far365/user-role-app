import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

export const debugParentQueueData = api(
  { method: "POST", path: "/queue/debug-parent-queue-data", expose: true },
  async ({ parentId }: { parentId: string }) => {
    console.log(`=== DEBUG PARENT QUEUE DATA ===`);
    console.log(`Parent ID: ${parentId}`);
    
    try {
      const { data: students, error: studentError } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', parentId);
      
      console.log(`Students for parent ${parentId}:`, students);
      console.log(`Student error:`, studentError);
      
      const studentIds = students?.map(s => s.studentid) || [];
      console.log(`Student IDs:`, studentIds);
      
      const { data: queues, error: queueError } = await supabase
        .from('queuercd')
        .select('*')
        .order('queuecloseddttm', { ascending: false })
        .limit(5);
      
      console.log(`Recent queues:`, queues);
      console.log(`Queue error:`, queueError);
      
      if (queues && queues.length > 0 && studentIds.length > 0) {
        const latestQueue = queues[0];
        console.log(`Latest queue:`, latestQueue);
        
        const { data: queueItems, error: queueItemError } = await supabase
          .from('queueitemsrcd')
          .select('*')
          .eq('queueid', latestQueue.queueid)
          .in('studentid', studentIds);
        
        console.log(`Queue items for students:`, queueItems);
        console.log(`Queue item error:`, queueItemError);
        
        return {
          parentId,
          students,
          studentIds,
          latestQueue,
          queueItems,
          studentError,
          queueError,
          queueItemError
        };
      }
      
      return {
        parentId,
        students,
        studentIds,
        queues,
        studentError,
        queueError,
        message: 'No queues or students found'
      };
    } catch (err) {
      console.error(`Exception:`, err);
      return {
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
);
