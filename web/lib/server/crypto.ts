import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * AniList token custody (SPEC guardrail): tokens are AES-256-GCM encrypted at
 * rest with TOKEN_ENC_KEY (32 bytes, base64) and NEVER reach the client — the
 * browser only ever holds an opaque Oshi session cookie.
 * Blob layout: 12-byte IV | 16-byte GCM tag | ciphertext.
 */

function key(): Buffer {
  const b64 = process.env.TOKEN_ENC_KEY;
  if (!b64) throw new Error("TOKEN_ENC_KEY is not set");
  const k = Buffer.from(b64, "base64");
  if (k.length !== 32) throw new Error("TOKEN_ENC_KEY must be 32 bytes (base64)");
  return k;
}

export function encryptToken(plain: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]);
}

export function decryptToken(blob: Buffer): string {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ct = blob.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export function sha256hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}
