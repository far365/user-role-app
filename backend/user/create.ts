import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import type { User, UserRole, UserStatus } from "./types";

export interface CreateUserRequest {
  loginID: string;
  hashedPassword: string;
  userRole: UserRole;
  userID: string;
  userName: string;
  userStatus?: UserStatus;
  lastPhoneHash?: string;
  lastDeviceID?: string;
}

export interface CreateUserResponse {
  user: User;
  success: boolean;
}

// Creates a new user record in the database.
export const create = api<CreateUserRequest, CreateUserResponse>(
  { expose: true, method: "POST", path: "/user/create" },
  async (req) => {
    const {
      loginID,
      hashedPassword,
      userRole,
      userID,
      userName,
      userStatus = "Active",
      lastPhoneHash,
      lastDeviceID
    } = req;

    // Validate required fields
    if (!loginID || !hashedPassword || !userRole || !userID || !userName) {
      throw APIError.invalidArgument("Missing required fields");
    }

    // Validate loginID length (max 12 characters)
    if (loginID.length > 12) {
      throw APIError.invalidArgument("loginID must be 12 characters or less");
    }

    // Validate userID and userName length (max 8 characters)
    if (userID.length > 8) {
      throw APIError.invalidArgument("userID must be 8 characters or less");
    }

    if (userName.length > 8) {
      throw APIError.invalidArgument("userName must be 8 characters or less");
    }

    // Validate userRole
    const validRoles: UserRole[] = ["Parent", "Admin", "Teacher", "Dispatch"];
    if (!validRoles.includes(userRole)) {
      throw APIError.invalidArgument("Invalid user role");
    }

    // Validate userStatus
    const validStatuses: UserStatus[] = ["Active", "Disabled"];
    if (!validStatuses.includes(userStatus)) {
      throw APIError.invalidArgument("Invalid user status");
    }

    try {
      // Check if loginID already exists
      const existingLoginID = await userDB.queryRow`
        SELECT loginID FROM usersRcd WHERE loginID = ${loginID}
      `;
      if (existingLoginID) {
        throw APIError.alreadyExists("User with this loginID already exists");
      }

      // Check if userID already exists
      const existingUserID = await userDB.queryRow`
        SELECT userID FROM usersRcd WHERE userID = ${userID}
      `;
      if (existingUserID) {
        throw APIError.alreadyExists("User with this userID already exists");
      }

      // Check if userName already exists
      const existingUserName = await userDB.queryRow`
        SELECT userName FROM usersRcd WHERE userName = ${userName}
      `;
      if (existingUserName) {
        throw APIError.alreadyExists("User with this userName already exists");
      }

      // Insert new user
      await userDB.exec`
        INSERT INTO usersRcd (
          loginID, hashedPassword, userRole, userID, userName, userStatus,
          lastPhoneHash, lastDeviceID
        ) VALUES (
          ${loginID}, ${hashedPassword}, ${userRole}, ${userID}, ${userName}, ${userStatus},
          ${lastPhoneHash || null}, ${lastDeviceID || null}
        )
      `;

      // Retrieve the created user
      const createdUserRow = await userDB.queryRow<{
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

      if (!createdUserRow) {
        throw APIError.internal("Failed to retrieve created user");
      }

      const user: User = {
        loginID: createdUserRow.loginID,
        userRole: createdUserRow.userRole as UserRole,
        userID: createdUserRow.userID,
        userName: createdUserRow.userName,
        userStatus: createdUserRow.userStatus as UserStatus,
        lastLoginDTTM: createdUserRow.lastLoginDTTM,
        lastPhoneHash: createdUserRow.lastPhoneHash,
        lastDeviceID: createdUserRow.lastDeviceID,
        createdAt: createdUserRow.createdAt,
        updatedAt: createdUserRow.updatedAt,
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
      
      // Handle database constraint violations
      if (error instanceof Error) {
        if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
          if (error.message.includes('loginID')) {
            throw APIError.alreadyExists("User with this loginID already exists");
          } else if (error.message.includes('userID')) {
            throw APIError.alreadyExists("User with this userID already exists");
          } else if (error.message.includes('userName')) {
            throw APIError.alreadyExists("User with this userName already exists");
          }
          throw APIError.alreadyExists("User with this information already exists");
        }
        
        if (error.message.includes('CHECK constraint')) {
          throw APIError.invalidArgument("Invalid user role or status");
        }
      }
      
      throw APIError.internal("Failed to create user");
    }
  }
);
