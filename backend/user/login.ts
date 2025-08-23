import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import type { LoginRequest, LoginResponse, User } from "./types";

// Authenticates a user and updates their last login information.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/user/login" },
  async (req) => {
    const { loginID, password, deviceID } = req;

    // Get user from database
    const userRow = await userDB.queryRow<{
      loginID: string;
      hashedPassword: string;
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
      SELECT * FROM usersRcd WHERE loginID = ${loginID}
    `;

    if (!userRow) {
      throw APIError.notFound("User not found");
    }

    if (userRow.userStatus !== "Active") {
      throw APIError.permissionDenied("User account is disabled");
    }

    // In a real app, you would verify the password hash here
    // For demo purposes, we'll accept any password
    
    // Update last login information
    await userDB.exec`
      UPDATE usersRcd 
      SET lastLoginDTTM = CURRENT_TIMESTAMP,
          lastDeviceID = ${deviceID || null},
          updatedAt = CURRENT_TIMESTAMP
      WHERE loginID = ${loginID}
    `;

    // Get updated user data
    const updatedUserRow = await userDB.queryRow<{
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

    const user: User = {
      loginID: updatedUserRow!.loginID,
      userRole: updatedUserRow!.userRole as any,
      userID: updatedUserRow!.userID,
      userName: updatedUserRow!.userName,
      userStatus: updatedUserRow!.userStatus as any,
      lastLoginDTTM: updatedUserRow!.lastLoginDTTM,
      lastPhoneHash: updatedUserRow!.lastPhoneHash,
      lastDeviceID: updatedUserRow!.lastDeviceID,
      createdAt: updatedUserRow!.createdAt,
      updatedAt: updatedUserRow!.updatedAt,
    };

    return {
      user,
      success: true,
    };
  }
);
