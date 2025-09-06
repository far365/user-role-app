import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";
import type { LoginRequest, LoginResponse, User } from "./types";

// Authenticates a user and updates their last login information.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/user/login" },
  async (req) => {
    const { loginID, deviceID } = req;

    if (!loginID || !loginID.trim()) {
      throw APIError.invalidArgument("Login ID is required");
    }

    try {
      console.log(`[Login] Attempting login for user: ${loginID.trim()}`);
      
      // Get user from database - select all fields to see what's available
      const { data: userRow, error } = await supabase
        .from('usersrcd')
        .select('*')
        .eq('loginid', loginID.trim())
        .single();

      console.log(`[Login] Database query result:`, { userRow: userRow ? 'found' : 'not found', error: error?.message });

      if (error) {
        console.error("[Login] Supabase query error:", error);
        throw APIError.notFound("User not found");
      }

      if (!userRow) {
        console.log(`[Login] No user found with loginID: ${loginID.trim()}`);
        throw APIError.notFound("User not found");
      }

      if (userRow.userstatus !== "Active") {
        console.log(`[Login] User account is disabled. Status: ${userRow.userstatus}`);
        throw APIError.permissionDenied("User account is disabled");
      }

      console.log(`[Login] User found and active: ${userRow.loginid}`);

      // Update last login information
      try {
        const { data: updatedUser, error: updateError } = await supabase
          .from('usersrcd')
          .update({
            lastlogindttm: new Date().toISOString()
          })
          .eq('loginid', loginID.trim())
          .select('*')
          .single();

        if (updateError) {
          console.error("[Login] Failed to update login timestamp:", updateError);
          // Don't fail the login if we can't update the timestamp
        } else {
          console.log(`[Login] Updated login timestamp for user: ${loginID.trim()}`);
        }
      } catch (updateErr) {
        console.error("[Login] Exception updating login timestamp:", updateErr);
        // Don't fail the login if we can't update the timestamp
      }

      // Use updated user data if available, otherwise use original
      const finalUser = userRow;

      const user: User = {
        loginID: finalUser.loginid,
        userRole: finalUser.userrole as any,
        userID: finalUser.userid,
        displayName: finalUser.displayname,
        userStatus: finalUser.userstatus as any,
        lastLoginDTTM: finalUser.lastlogindttm ? new Date(finalUser.lastlogindttm) : null,
        lastPhoneHash: finalUser.lastphonehash || null,
        lastDeviceID: finalUser.lastdeviceid || null,
        createdAt: finalUser.createdat ? new Date(finalUser.createdat) : new Date(),
        updatedAt: finalUser.updatedat ? new Date(finalUser.updatedat) : new Date(),
      };

      console.log(`[Login] Login successful for user: ${user.loginID} (${user.userRole})`);

      return {
        user,
        success: true,
      };

    } catch (error) {
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        console.log(`[Login] APIError: ${error.message}`);
        throw error;
      }
      
      console.error("[Login] Unexpected error:", error);
      throw APIError.notFound("User not found");
    }
  }
);
