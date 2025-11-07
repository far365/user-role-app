import { api, APIError } from "encore.dev/api";
import { supabase } from "./supabase";
import type { VerifyLoginRequest, VerifyLoginResponse } from "./types";

export const verifylogin = api<VerifyLoginRequest, VerifyLoginResponse>(
  { expose: true, method: "POST", path: "/user/verifylogin" },
  async (req) => {
    const { loginID, password, timezone } = req;

    if (!loginID || !loginID.trim()) {
      throw APIError.invalidArgument("Login ID is required");
    }

    if (!password) {
      throw APIError.invalidArgument("Password is required");
    }

    if (!timezone || !timezone.trim()) {
      throw APIError.invalidArgument("Timezone is required");
    }

    try {
      console.log(`[VerifyLogin] Attempting login for user: ${loginID.trim()}`);

      const { data, error } = await supabase.rpc('verifylogin', {
        p_loginid: loginID.trim(),
        p_password: password,
        p_timezone: timezone.trim(),
      });

      if (error) {
        console.error("[VerifyLogin] Supabase RPC error:", error);
        throw APIError.unauthenticated("Invalid login credentials");
      }

      if (!data || data.length === 0) {
        console.log(`[VerifyLogin] No data returned from verifylogin function`);
        throw APIError.unauthenticated("Invalid login credentials");
      }

      const result = data[0];

      if (result.msg) {
        console.log(`[VerifyLogin] Login failed with message: ${result.msg}`);
        throw APIError.unauthenticated(result.msg);
      }

      console.log(`[VerifyLogin] Login successful for user: ${result.out_loginid}`);

      return result;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      console.error("[VerifyLogin] Unexpected error:", error);
      throw APIError.unauthenticated("Invalid login credentials");
    }
  }
);
