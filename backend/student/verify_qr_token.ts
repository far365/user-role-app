import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createHmac } from "crypto";

const qrSigningKey = secret("QRSigningKey");

interface VerifyQRTokenRequest {
  token: string;
}

interface VerifyQRTokenResponse {
  valid: boolean;
  studentId?: string;
  error?: string;
}

export const verifyQRToken = api(
  { method: "POST", path: "/student/qr/verify", expose: true },
  async ({ token }: VerifyQRTokenRequest): Promise<VerifyQRTokenResponse> => {
    if (!token || typeof token !== "string") {
      return {
        valid: false,
        error: "Invalid token format"
      };
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return {
        valid: false,
        error: "Invalid token structure"
      };
    }

    const [studentId, providedSignature] = parts;

    if (!studentId) {
      return {
        valid: false,
        error: "Missing student ID"
      };
    }

    const expectedSignature = createHmac("sha256", qrSigningKey())
      .update(studentId)
      .digest("hex");

    if (expectedSignature !== providedSignature) {
      return {
        valid: false,
        error: "Invalid signature - QR code may have been tampered with"
      };
    }

    return {
      valid: true,
      studentId
    };
  }
);
