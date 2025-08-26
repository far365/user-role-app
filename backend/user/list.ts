import { api } from "encore.dev/api";
import { supabase } from "./supabase";
import type { User } from "./types";

export interface ListUsersResponse {
  users: User[];
}

// Retrieves all user records from the Supabase database.
export const list = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/user/list" },
  async () => {
    const { data: userRows, error } = await supabase
      .from('usersrcd')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const users: User[] = (userRows || []).map(row => ({
      loginID: row.loginid,
      userRole: row.userrole as any,
      userID: row.userid,
      displayName: row.displayname,
      userStatus: row.userstatus as any,
      lastLoginDTTM: row.lastlogindttm ? new Date(row.lastlogindttm) : null,
      lastPhoneHash: row.lastphonehash || null,
      lastDeviceID: row.lastdeviceid || null,
      createdAt: row.createdat ? new Date(row.createdat) : new Date(),
      updatedAt: row.updatedat ? new Date(row.updatedat) : new Date(),
    }));

    return { users };
  }
);
