import { randomBytes, createHash } from "crypto";

const TOKEN_PREFIX = "hsk_";

export function generateHealthSyncToken(): string {
  return TOKEN_PREFIX + randomBytes(24).toString("base64url");
}

export function hashHealthSyncToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
