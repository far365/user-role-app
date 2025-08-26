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
      // Get user from database - select all fields to see what's available
      const { data: userRow, error } = await supabase
        .from('usersrcd')
        .select('*')
        .eq('loginid', loginID.trim())
        .single();

      if (error) {
        console.error("Supabase query error:", error);
        throw APIError.notFound("User not found");
      }

      if (!userRow) {
        throw APIError.notFound("User not found");
      }

      if (userRow.userstatus !== "Active") {
        throw APIError.permissionDenied("User account is disabled");
      }

      // Update last login information
      const { data: updatedUser, error: updateError } = await supabase
        .from('usersrcd')
        .update({
          lastlogindttm: new Date().toISOString(),
          lastdeviceid: deviceID || null,
          updatedat: new Date().toISOString()
        })
        .eq('loginid', loginID.trim())
        .select('*')
        .single();

      if (updateError) {
        console.error("Failed to update login information:", updateError);
        // Don't fail the login if we can't update the timestamp
      }

      const finalUser = updatedUser || userRow;

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

      return {
        user,
        success: true,
      };

    } catch (error) {
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Login error:", error);
      throw APIError.notFound("User not found");
    }
  }
);
