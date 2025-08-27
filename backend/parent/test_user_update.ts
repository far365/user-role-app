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
}

// Test endpoint to verify user table update functionality.
export const testUserUpdate = api<TestUserUpdateRequest, TestUserUpdateResponse>(
  { expose: true, method: "POST", path: "/parent/test-user-update" },
  async ({ username, newDisplayName }) => {
    try {
      console.log(`[Test] Testing user update for username: ${username}, new name: ${newDisplayName}`);
      
      // First, let's check the table schema to see what columns exist
      const { data: tableSchema, error: schemaError } = await supabase
        .from('usersrcd')
        .select('*')
        .limit(1);

      console.log(`[Test] Table schema check:`, { tableSchema, schemaError });

      // Get current user data
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
          tableSchema: tableSchema?.[0] || null
        };
      }

      // Only update the displayname field - no timestamp fields
      const updatePayload = {
        displayname: newDisplayName
      };

      console.log(`[Test] Update payload:`, updatePayload);

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
        tableSchema: tableSchema?.[0] || null
      };

    } catch (error) {
      console.error("[Test] Unexpected error:", error);
      return {
        success: false,
        beforeUpdate: null,
        afterUpdate: null,
        updateResult: null,
        error: error instanceof Error ? error.message : "Unknown error",
        tableSchema: null
      };
    }
  }
);
