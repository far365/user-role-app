import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface DebugResponse {
  usersrcdRecords: any[];
  parentrcdRecords: any[];
  specificUser: any;
  specificParent: any;
  usersrcdTableInfo: any;
  parentrcdTableInfo: any;
}

// Debug endpoint to check database contents and table structure.
export const debug = api<{ username: string }, DebugResponse>(
  { expose: true, method: "GET", path: "/parent/debug/:username" },
  async ({ username }) => {
    try {
      console.log(`[Debug] Starting debug for username: ${username}`);
      
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
        .eq('loginid', username)
        .single();

      // Try to get parent record by matching parentid with username
      const { data: specificParent, error: parentSpecificError } = await supabase
        .from('parentrcd')
        .select('*')
        .eq('parentid', username)
        .single();

      // Get table structure information
      const { data: usersrcdTableInfo, error: usersTableError } = await supabase
        .rpc('get_table_columns', { table_name: 'usersrcd' })
        .then(result => result)
        .catch(() => ({ data: null, error: 'Could not get table info' }));

      const { data: parentrcdTableInfo, error: parentTableError } = await supabase
        .rpc('get_table_columns', { table_name: 'parentrcd' })
        .then(result => result)
        .catch(() => ({ data: null, error: 'Could not get table info' }));

      console.log('Debug results:', {
        usersrcdCount: usersrcdRecords?.length || 0,
        parentrcdCount: parentrcdRecords?.length || 0,
        specificUser,
        specificParent,
        usersError,
        parentError,
        specificError,
        parentSpecificError,
        usersTableError,
        parentTableError
      });

      return {
        usersrcdRecords: usersrcdRecords || [],
        parentrcdRecords: parentrcdRecords || [],
        specificUser: specificUser || null,
        specificParent: specificParent || null,
        usersrcdTableInfo: usersrcdTableInfo || null,
        parentrcdTableInfo: parentrcdTableInfo || null
      };

    } catch (error) {
      console.error("Debug error:", error);
      throw new Error("Debug failed");
    }
  }
);
