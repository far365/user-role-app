import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface DebugResponse {
  usersrcdRecords: any[];
  parentrcdRecords: any[];
  specificUser: any;
  specificParent: any;
}

// Debug endpoint to check database contents.
export const debug = api<{ username: string }, DebugResponse>(
  { expose: true, method: "GET", path: "/parent/debug/:username" },
  async ({ username }) => {
    try {
      // Get all usersrcd records
      const { data: usersrcdRecords, error: usersError } = await supabase
        .from('usersrcd')
        .select('*');

      // Get all parentrcd records
      const { data: parentrcdRecords, error: parentError } = await supabase
        .from('parentrcd')
        .select('*');

      // Get specific user
      const { data: specificUser, error: specificError } = await supabase
        .from('usersrcd')
        .select('*')
        .eq('username', username)
        .single();

      // Try to get parent record by matching parentid with username
      const { data: specificParent, error: parentSpecificError } = await supabase
        .from('parentrcd')
        .select('*')
        .eq('parentid', username)
        .single();

      console.log('Debug results:', {
        usersrcdCount: usersrcdRecords?.length || 0,
        parentrcdCount: parentrcdRecords?.length || 0,
        specificUser,
        specificParent,
        usersError,
        parentError,
        specificError,
        parentSpecificError
      });

      return {
        usersrcdRecords: usersrcdRecords || [],
        parentrcdRecords: parentrcdRecords || [],
        specificUser: specificUser || null,
        specificParent: specificParent || null
      };

    } catch (error) {
      console.error("Debug error:", error);
      throw new Error("Debug failed");
    }
  }
);
