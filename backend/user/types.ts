export type UserRole = "Parent" | "Admin" | "Teacher" | "Dispatch" | "QRScanner";
export type UserStatus = "Active" | "Disabled";

export interface User {
  loginID: string;
  userRole: UserRole;
  userID: string;
  displayName: string;
  userStatus: UserStatus;
  lastLoginDTTM: Date | null;
  lastPhoneHash: string | null;
  lastDeviceID: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  loginID: string;
  password?: string;
  deviceID?: string;
}

export interface LoginResponse {
  user: User;
  success: boolean;
}

export interface UserProfileResponse {
  user: User;
}
