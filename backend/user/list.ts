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
      .select('loginID, userRole, userID, userName, userStatus, lastLoginDTTM, lastPhoneHash, lastDeviceID, createdAt, updatedAt')
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const users: User[] = (userRows || []).map(row => ({
      loginID: row.loginID,
      userRole: row.userRole as any,
      userID: row.userID,
      userName: row.userName,
      userStatus: row.userStatus as any,
      lastLoginDTTM: row.lastLoginDTTM ? new Date(row.lastLoginDTTM) : null,
      lastPhoneHash: row.lastPhoneHash,
      lastDeviceID: row.lastDeviceID,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));

    return { users };
  }
);
