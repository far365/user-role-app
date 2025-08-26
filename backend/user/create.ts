import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";
import type { User, UserRole, UserStatus } from "./types";

export interface CreateUserRequest {
  loginID: string;
  hashedPassword: string;
  userRole: UserRole;
  userID: string;
  displayName: string;
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
      displayName,
      userStatus = "Active",
      lastPhoneHash,
      lastDeviceID
    } = req;

    // Validate required fields
    if (!loginID || !hashedPassword || !userRole || !userID || !displayName) {
      throw APIError.invalidArgument("Missing required fields");
    }

    // Validate loginID length (max 12 characters)
    if (loginID.length > 12) {
      throw APIError.invalidArgument("loginID must be 12 characters or less");
    }

    // Validate userID and displayName length (max 8 characters)
    if (userID.length > 8) {
      throw APIError.invalidArgument("userID must be 8 characters or less");
    }

    if (displayName.length > 8) {
      throw APIError.invalidArgument("displayName must be 8 characters or less");
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
      const { data: existingLoginID } = await supabase
        .from('usersrcd')
        .select('loginid')
        .eq('loginid', loginID)
        .single();

      if (existingLoginID) {
        throw APIError.alreadyExists("User with this loginID already exists");
      }

      // Check if userID already exists
      const { data: existingUserID } = await supabase
        .from('usersrcd')
        .select('userid')
        .eq('userid', userID)
        .single();

      if (existingUserID) {
        throw APIError.alreadyExists("User with this userID already exists");
      }

      // Check if displayName already exists
      const { data: existingDisplayName } = await supabase
        .from('usersrcd')
        .select('displayname')
        .eq('displayname', displayName)
        .single();

      if (existingDisplayName) {
        throw APIError.alreadyExists("User with this displayName already exists");
      }

      // Insert new user
      const { data: insertedUser, error: insertError } = await supabase
        .from('usersrcd')
        .insert({
          loginid: loginID,
          hashedpassword: hashedPassword,
          userrole: userRole,
          userid: userID,
          displayname: displayName,
          userstatus: userStatus,
          lastphonehash: lastPhoneHash || null,
          lastdeviceid: lastDeviceID || null
        })
        .select('loginid, userrole, userid, displayname, userstatus, lastlogindttm, lastphonehash, lastdeviceid, createdat, updatedat')
        .single();

      if (insertError) {
        throw new Error(`Failed to create user: ${insertError.message}`);
      }

      if (!insertedUser) {
        throw APIError.internal("Failed to retrieve created user");
      }

      const user: User = {
        loginID: insertedUser.loginid,
        userRole: insertedUser.userrole as UserRole,
        userID: insertedUser.userid,
        displayName: insertedUser.displayname,
        userStatus: insertedUser.userstatus as UserStatus,
        lastLoginDTTM: insertedUser.lastlogindttm ? new Date(insertedUser.lastlogindttm) : null,
        lastPhoneHash: insertedUser.lastphonehash,
        lastDeviceID: insertedUser.lastdeviceid,
        createdAt: new Date(insertedUser.createdat),
        updatedAt: new Date(insertedUser.updatedat),
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
          if (error.message.includes('loginid')) {
            throw APIError.alreadyExists("User with this loginID already exists");
          } else if (error.message.includes('userid')) {
            throw APIError.alreadyExists("User with this userID already exists");
          } else if (error.message.includes('displayname')) {
            throw APIError.alreadyExists("User with this displayName already exists");
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
