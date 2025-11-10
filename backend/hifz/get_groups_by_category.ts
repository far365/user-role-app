import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface GroupResponse {
  id: number;
  groupname: string;
  category: string;
}

export const getGroupsByCategory = api<{ category: string }, { groups: GroupResponse[] }>(
  { expose: true, method: "GET", path: "/hifz/get-groups-by-category/:category" },
  async ({ category }) => {
    try {
      const { data, error } = await supabase
        .rpc('get_groups_by_category', { p_groupcategory: category });

      if (error) {
        console.error("[Hifz API] Supabase function error:", error);
        throw APIError.internal(`Failed to fetch groups by category: ${error.message}`);
      }

      if (!data) {
        return { groups: [] };
      }

      const groups: GroupResponse[] = data.map((row: any) => ({
        id: Number(row.id),
        groupname: row.groupname,
        category: row.category,
      }));

      return { groups };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("[Hifz API] Unexpected error calling Supabase function:", error);
      throw APIError.internal("Failed to fetch groups by category");
    }
  }
);
