import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";
import type { UserProfileResponse, User } from "./types";

// Retrieves user profile information by login ID.
export const getProfile = api<{ loginID: string }, UserProfileResponse>(
  { expose: true, method: "GET", path: "/user/profile/:loginID" },
  async ({ loginID }) => {
    const { data: userRow, error } = await supabase
      .from('usersrcd')
      .select('loginid, userrole, userid, displayname, userstatus, lastlogindttm, lastphonehash, lastdeviceid, createdat, updatedat')
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
      lastPhoneHash: userRow.lastphonehash,
      lastDeviceID: userRow.lastdeviceid,
      createdAt: new Date(userRow.createdat),
      updatedAt: new Date(userRow.updatedat),
    };

    return { user };
  }
);
