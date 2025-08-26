import { api } from "encore.dev/api";
import { supabase } from "./supabase";

export interface ListUsersrcdResponse {
  records: any[];
}

// Retrieves all records from the usersrcd table with all fields.
export const list_usersrcd = api<void, ListUsersrcdResponse>(
  { expose: true, method: "GET", path: "/user/list_usersrcd" },
  async () => {
    const { data: records, error } = await supabase
      .from('usersrcd')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch usersrcd records: ${error.message}`);
    }

    return { records: records || [] };
  }
);
