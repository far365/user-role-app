import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface TestUserUpdateRequest {
  username: string;
  newDisplayName: string;
}

export interface TestUserUpdateResponse {
  success: boolean;
  beforeUpdate: any;
  afterUpdate: any;
  updateResult: any;
  error?: string;
  tableSchema?: any;
  availableColumns?: string[];
  updateQuery?: string;
}

// Test endpoint to verify user table update functionality.
export const testUserUpdate = api<TestUserUpdateRequest, TestUserUpdateResponse>(
  { expose: true, method: "POST", path: "/parent/test-user-update" },
  async ({ username, newDisplayName }) => {
    try {
      console.log(`[Test] Testing user update for username: ${username}, new name: ${newDisplayName}`);
      
      // Get current user data to see available columns
      const { data: beforeUpdate, error: beforeError } = await supabase
        .from('usersrcd')
        .select('*')
        .eq('loginid', username)
        .single();

      console.log(`[Test] Before update:`, { beforeUpdate, beforeError });

      if (beforeError) {
        return {
          success: false,
          beforeUpdate: null,
          afterUpdate: null,
          updateResult: null,
          error: `Could not find user: ${beforeError.message}`,
          tableSchema: null,
          availableColumns: []
        };
      }

      // Get available columns
      const availableColumns = beforeUpdate ? Object.keys(beforeUpdate) : [];
      console.log(`[Test] Available columns in usersrcd:`, availableColumns);

      // Build update payload - try different possible column names for displayname
      const updatePayload: any = {};
      
      if (availableColumns.includes('displayname')) {
        updatePayload.displayname = newDisplayName;
        console.log(`[Test] Using 'displayname' column`);
      } else if (availableColumns.includes('display_name')) {
        updatePayload.display_name = newDisplayName;
        console.log(`[Test] Using 'display_name' column`);
      } else if (availableColumns.includes('displayName')) {
        updatePayload.displayName = newDisplayName;
        console.log(`[Test] Using 'displayName' column`);
      } else {
        return {
          success: false,
          beforeUpdate: beforeUpdate,
          afterUpdate: null,
          updateResult: null,
          error: `No displayname column found. Available columns: ${availableColumns.join(', ')}`,
          tableSchema: beforeUpdate,
          availableColumns: availableColumns
        };
      }

      console.log(`[Test] Update payload:`, updatePayload);
      const updateQuery = `UPDATE usersrcd SET ${Object.keys(updatePayload).map(k => `${k} = '${updatePayload[k]}'`).join(', ')} WHERE loginid = '${username}'`;
      console.log(`[Test] Equivalent SQL:`, updateQuery);

      // Attempt to update
      const { data: updateResult, error: updateError } = await supabase
        .from('usersrcd')
        .update(updatePayload)
        .eq('loginid', username)
        .select('*');

      console.log(`[Test] Update result:`, { updateResult, updateError });

      // Get updated user data
      const { data: afterUpdate, error: afterError } = await supabase
        .from('usersrcd')
        .select('*')
        .eq('loginid', username)
        .single();

      console.log(`[Test] After update:`, { afterUpdate, afterError });

      return {
        success: !updateError,
        beforeUpdate: beforeUpdate || null,
        afterUpdate: afterUpdate || null,
        updateResult: updateResult || null,
        error: updateError ? updateError.message : undefined,
        tableSchema: beforeUpdate,
        availableColumns: availableColumns,
        updateQuery: updateQuery
      };

    } catch (error) {
      console.error("[Test] Unexpected error:", error);
      return {
        success: false,
        beforeUpdate: null,
        afterUpdate: null,
        updateResult: null,
        error: error instanceof Error ? error.message : "Unknown error",
        tableSchema: null,
        availableColumns: []
      };
    }
  }
);
