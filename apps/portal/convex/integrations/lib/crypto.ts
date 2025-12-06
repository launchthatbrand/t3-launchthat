"use node";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Utilities for encrypting/decrypting secret records at rest.
 *
 * Storage format: Uint8Array of [12-byte IV][16-byte auth tag][ciphertext]
 */
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(): Buffer {
  const keyB64 = process.env.SECRETS_ENCRYPTION_KEY;
  if (!keyB64) {
    throw new Error(
      "Missing SECRETS_ENCRYPTION_KEY env var for secrets encryption",
    );
  }
  // Expect base64 for flexibility
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) {
    throw new Error("SECRETS_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  }
  return key;
}

export function encryptRecord(record: Record<string, string>): ArrayBuffer {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(record), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const out = Buffer.concat([iv, tag, ciphertext]);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

export function decryptRecord(bytes: ArrayBuffer): Record<string, string> {
  const buf = Buffer.from(bytes);
  if (buf.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Encrypted payload too short");
  }
  const key = getKey();
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  const json = plaintext.toString("utf8");
  const parsed = JSON.parse(json) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Decrypted payload is not an object");
  }
  return parsed as Record<string, string>;
}

export function maskFromRecord(
  record: Record<string, string>,
): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(record)) {
    const suffix = v ? v.slice(-4) : "";
    masked[k] = `****${suffix}`;
  }
  return masked;
}
