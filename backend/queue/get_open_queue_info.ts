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
      const { data, error } = await supabase.rpc('get_open_queue_info', { p_timezone: timeZone });

      if (error) {
        return { status: `Error: ${error.message}` };
      }

      return { status: data as string };
    } catch (err) {
      return { status: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
);
