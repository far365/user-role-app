import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";
import type { LoginRequest, LoginResponse, User } from "./types";

// Authenticates a user and updates their last login information.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/user/login" },
  async (req) => {
    const { loginID, password, deviceID } = req;

    // Get user from database
    const { data: userRow, error } = await supabase
      .from('usersrcd')
      .select('loginid, hashedpassword, userrole, userid, username, userstatus, lastlogindttm, lastphonehash, lastdeviceid, createdat, updatedat')
      .eq('loginid', loginID)
      .single();

    if (error || !userRow) {
      throw APIError.notFound("User not found");
    }

    if (userRow.userstatus !== "Active") {
      throw APIError.permissionDenied("User account is disabled");
    }

    // In a real app, you would verify the password hash here
    // For demo purposes, we'll accept any password
    
    // Update last login information
    const { data: updatedUser, error: updateError } = await supabase
      .from('usersrcd')
      .update({
        lastlogindttm: new Date().toISOString(),
        lastdeviceid: deviceID || null,
        updatedat: new Date().toISOString()
      })
      .eq('loginid', loginID)
      .select('loginid, userrole, userid, username, userstatus, lastlogindttm, lastphonehash, lastdeviceid, createdat, updatedat')
      .single();

    if (updateError || !updatedUser) {
      throw APIError.internal("Failed to update login information");
    }

    const user: User = {
      loginID: updatedUser.loginid,
      userRole: updatedUser.userrole as any,
      userID: updatedUser.userid,
      userName: updatedUser.username,
      userStatus: updatedUser.userstatus as any,
      lastLoginDTTM: updatedUser.lastlogindttm ? new Date(updatedUser.lastlogindttm) : null,
      lastPhoneHash: updatedUser.lastphonehash,
      lastDeviceID: updatedUser.lastdeviceid,
      createdAt: new Date(updatedUser.createdat),
      updatedAt: new Date(updatedUser.updatedat),
    };

    return {
      user,
      success: true,
    };
  }
);
