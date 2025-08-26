import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";
import type { UserProfileResponse, User } from "./types";

// Retrieves user profile information by login ID.
export const getProfile = api<{ loginID: string }, UserProfileResponse>(
  { expose: true, method: "GET", path: "/user/profile/:loginID" },
  async ({ loginID }) => {
    const { data: userRow, error } = await supabase
      .from('usersrcd')
      .select('*')
      .eq('loginid', loginID)
      .single();

    if (error || !userRow) {
      throw APIError.notFound("User not found");
    }

    const user: User = {
      loginID: userRow.loginid,
      userRole: userRow.userrole as any,
      userID: userRow.userid,
      displayName: userRow.displayname,
      userStatus: userRow.userstatus as any,
      lastLoginDTTM: userRow.lastlogindttm ? new Date(userRow.lastlogindttm) : null,
      lastPhoneHash: userRow.lastphonehash || null,
      lastDeviceID: userRow.lastdeviceid || null,
      createdAt: userRow.createdat ? new Date(userRow.createdat) : new Date(),
      updatedAt: userRow.updatedat ? new Date(userRow.updatedat) : new Date(),
    };

    return { user };
  }
);
