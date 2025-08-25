import { api } from "encore.dev/api";
import { userDB } from "./db";
import type { User } from "./types";

export interface ListUsersResponse {
  users: User[];
}

// Retrieves all user records from the database.
export const list = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/user/list" },
  async () => {
    const userRows = await userDB.queryAll<{
      loginID: string;
      userRole: string;
      userID: string;
      userName: string;
      userStatus: string;
      lastLoginDTTM: Date | null;
      lastPhoneHash: string | null;
      lastDeviceID: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>`
      SELECT loginID, userRole, userID, userName, userStatus, 
             lastLoginDTTM, lastPhoneHash, lastDeviceID, createdAt, updatedAt
      FROM usersRcd
      ORDER BY createdAt DESC
    `;

    const users: User[] = userRows.map(row => ({
      loginID: row.loginID,
      userRole: row.userRole as any,
      userID: row.userID,
      userName: row.userName,
      userStatus: row.userStatus as any,
      lastLoginDTTM: row.lastLoginDTTM,
      lastPhoneHash: row.lastPhoneHash,
      lastDeviceID: row.lastDeviceID,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return { users };
  }
);
