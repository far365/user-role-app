import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createHmac } from "crypto";

const qrSigningKey = secret("QRSigningKey");

interface GenerateQRTokenRequest {
  studentId: string;
}

interface GenerateQRTokenResponse {
  token: string;
}

export const generateQRToken = api(
  { method: "POST", path: "/student/qr/generate", expose: true },
  async ({ studentId }: GenerateQRTokenRequest): Promise<GenerateQRTokenResponse> => {
    const signature = createHmac("sha256", qrSigningKey())
      .update(studentId)
      .digest("hex");
    
    const token = `${studentId}.${signature}`;
    
    return { token };
  }
);
