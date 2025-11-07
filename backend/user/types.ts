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

export interface VerifyLoginRequest {
  loginID: string;
  password: string;
  timezone: string;
}

export interface VerifyLoginUserData {
  loginid: string;
  timezone: string;
  userrole: UserRole;
  displayname: string;
  temppassword: string | null;
  lastlogindttm: string | null;
}

export interface VerifyLoginResponse {
  out_loginid: string;
  user_data: VerifyLoginUserData;
  msg: string | null;
}
