import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import type { UserProfileResponse, User } from "./types";

// Retrieves user profile information by login ID.
export const getProfile = api<{ loginID: string }, UserProfileResponse>(
  { expose: true, method: "GET", path: "/user/profile/:loginID" },
  async ({ loginID }) => {
    const userRow = await userDB.queryRow<{
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
      FROM usersRcd WHERE loginID = ${loginID}
    `;

    if (!userRow) {
      throw APIError.notFound("User not found");
    }

    const user: User = {
      loginID: userRow.loginID,
      userRole: userRow.userRole as any,
      userID: userRow.userID,
      userName: userRow.userName,
      userStatus: userRow.userStatus as any,
      lastLoginDTTM: userRow.lastLoginDTTM,
      lastPhoneHash: userRow.lastPhoneHash,
      lastDeviceID: userRow.lastDeviceID,
      createdAt: userRow.createdAt,
      updatedAt: userRow.updatedAt,
    };

    return { user };
  }
);
