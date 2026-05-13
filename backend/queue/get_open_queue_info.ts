import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface GetOpenQueueInfoRequest {
  timeZone: string;
}

interface GetOpenQueueInfoResponse {
  status: string;
}

export const getOpenQueueInfo = api<GetOpenQueueInfoRequest, GetOpenQueueInfoResponse>(
  { expose: true, method: "GET", path: "/queue/open-info" },
  async ({ timeZone }) => {
    try {
      const { data: queueRow, error } = await supabase
        .from('queuemasterrcd')
        .select('queueid, queuestarttime, queuemasterstatus')
        .eq('queuemasterstatus', 'Open')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { status: "No open queue found" };
        }
        return { status: `Error checking queue: ${error.message}` };
      }

      if (!queueRow) {
        return { status: "No open queue found" };
      }

      const startTime = queueRow.queuestarttime
        ? new Date(queueRow.queuestarttime).toLocaleString('en-US', { timeZone })
        : "unknown time";

      return { status: `Open queue found (ID: ${queueRow.queueid}, started: ${startTime} ${timeZone})` };
    } catch (err) {
      return { status: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
);
