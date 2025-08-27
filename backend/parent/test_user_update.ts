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
}

// Test endpoint to verify user table update functionality.
export const testUserUpdate = api<TestUserUpdateRequest, TestUserUpdateResponse>(
  { expose: true, method: "POST", path: "/parent/test-user-update" },
  async ({ username, newDisplayName }) => {
    try {
      console.log(`[Test] Testing user update for username: ${username}, new name: ${newDisplayName}`);
      
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
          error: `Could not find user: ${beforeError.message}`
        };
      }

      // Attempt to update
      const { data: updateResult, error: updateError } = await supabase
        .from('usersrcd')
        .update({
          displayname: newDisplayName,
          updatedat: new Date().toISOString()
        })
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
        error: updateError ? updateError.message : undefined
      };

    } catch (error) {
      console.error("[Test] Unexpected error:", error);
      return {
        success: false,
        beforeUpdate: null,
        afterUpdate: null,
        updateResult: null,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
);
