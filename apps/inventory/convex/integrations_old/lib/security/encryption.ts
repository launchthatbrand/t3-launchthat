/**
 * Encryption utilities for the integrations module
 *
 * This file provides functions for securely encrypting and decrypting
 * sensitive data like API keys, tokens, and other credentials.
 */
import { ConvexError, v } from "convex/values";

import { action } from "../../../_generated/server";

/**
 * Standard AES-256-CTR encryption algorithm
 */
const ALGORITHM = "aes-256-ctr";

/**
 * Number of key derivation iterations (higher is more secure but slower)
 */
const ITERATIONS = 100000;

/**
 * Key length in bytes (32 bytes = 256 bits for AES-256)
 */
const KEY_LENGTH = 32;

/**
 * Digest algorithm for key derivation
 */
const DIGEST = "sha256";

/**
 * Type definition for Node.js crypto module
 */
interface CryptoModule {
  randomBytes(size: number): Buffer;
  pbkdf2Sync(
    password: string,
    salt: string,
    iterations: number,
    keylen: number,
    digest: string,
  ): Buffer;
  createCipheriv(
    algorithm: string,
    key: Buffer,
    iv: Buffer,
  ): {
    update(data: Buffer): Buffer;
    final(): Buffer;
  };
  createDecipheriv(
    algorithm: string,
    key: Buffer,
    iv: Buffer,
  ): {
    update(data: Buffer): Buffer;
    final(): Buffer;
  };
}

// Node.js crypto module - only available in actions
let crypto: CryptoModule | null = null;

/**
 * Environment variable names
 */
const ENV_ENCRYPTION_KEY = "INTEGRATION_ENCRYPTION_KEY";
const ENV_ENCRYPTION_SALT = "INTEGRATION_ENCRYPTION_SALT";

/**
 * Get required environment variables for encryption
 * @returns Object with encryption key and salt
 * @throws ConvexError if environment variables are not set
 */
function getEncryptionEnv(): { key: string; salt: string } {
  const key = process.env[ENV_ENCRYPTION_KEY];
  const salt = process.env[ENV_ENCRYPTION_SALT];

  if (!key) {
    throw new ConvexError(
      `${ENV_ENCRYPTION_KEY} environment variable is not set`,
    );
  }

  if (!salt) {
    throw new ConvexError(
      `${ENV_ENCRYPTION_SALT} environment variable is not set`,
    );
  }

  return { key, salt };
}

/**
 * Derive an encryption key from the master key and salt
 * @param masterKey Master encryption key from environment
 * @param salt Salt from environment
 * @returns Derived key as Buffer
 */
function deriveKey(masterKey: string, salt: string): Buffer {
  // Lazy-load the crypto module (only available in Node.js context in actions)
  if (!crypto) {
    try {
      // We use 'require' because crypto is a Node.js built-in module not available in Convex
      // except in action functions. Using dynamic import would be better but requires
      // additional configuration.
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      crypto = require("crypto") as CryptoModule;
    } catch {
      throw new ConvexError("Crypto module is not available in this context");
    }
  }

  // Derive a key using PBKDF2
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

/**
 * Encrypt a string using AES-256-CTR
 * @param text Plain text to encrypt
 * @returns Encrypted text with IV as hex string
 */
function encryptText(text: string): string {
  const { key, salt } = getEncryptionEnv();
  const derivedKey = deriveKey(key, salt);

  if (!crypto) {
    throw new ConvexError("Crypto module not initialized");
  }

  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);

  // Create cipher with derived key and IV
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

  // Encrypt the text
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(text, "utf8")),
    cipher.final(),
  ]);

  // Combine IV and encrypted data as hex strings
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt an encrypted string
 * @param encryptedText Encrypted text with IV (format: "iv:encryptedData")
 * @returns Decrypted plain text
 * @throws Error if decryption fails
 */
function decryptText(encryptedText: string): string {
  const { key, salt } = getEncryptionEnv();
  const derivedKey = deriveKey(key, salt);

  if (!crypto) {
    throw new ConvexError("Crypto module not initialized");
  }

  // Split the IV and encrypted data
  const [ivHex, encryptedHex] = encryptedText.split(":");

  if (!ivHex || !encryptedHex) {
    throw new ConvexError("Invalid encrypted text format");
  }

  // Convert hex strings back to buffers
  const iv = Buffer.from(ivHex, "hex");
  const encryptedData = Buffer.from(encryptedHex, "hex");

  // Create decipher with derived key and IV
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);

  // Decrypt the data
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypt sensitive data (action)
 * This function must be called from an action since it uses Node.js crypto
 */
export const encryptData = action({
  args: {
    data: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (_, args) => {
    if (!args.data) {
      return null;
    }
    return encryptText(args.data);
  },
});

/**
 * Decrypt sensitive data (action)
 * This function must be called from an action since it uses Node.js crypto
 */
export const decryptData = action({
  args: {
    encryptedData: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (_, args) => {
    if (!args.encryptedData) {
      return null;
    }
    return decryptText(args.encryptedData);
  },
});

/**
 * Test if encryption is properly configured by encrypting and decrypting a test string
 * Returns true if encryption is working properly
 */
export const testEncryption = action({
  args: {},
  returns: v.boolean(),
  handler: async () => {
    try {
      const testString = `test-${Date.now()}`;
      const encrypted = encryptText(testString);
      const decrypted = decryptText(encrypted);
      return decrypted === testString;
    } catch (error) {
      console.error(
        "Encryption test failed:",
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  },
});

/**
 * Get the encryption configuration status
 * Returns an object with status information
 */
export const getEncryptionStatus = action({
  args: {},
  returns: v.object({
    isConfigured: v.boolean(),
    isWorking: v.boolean(),
    keyStatus: v.string(),
    saltStatus: v.string(),
    error: v.optional(v.string()),
  }),
  handler: async () => {
    try {
      const { key, salt } = getEncryptionEnv();
      const isKeySet = !!key;
      const isSaltSet = !!salt;
      const isEncryptionWorking = await testEncryption();

      return {
        isConfigured: isKeySet && isSaltSet,
        isWorking: isEncryptionWorking,
        keyStatus: isKeySet ? "set" : "missing",
        saltStatus: isSaltSet ? "set" : "missing",
      };
    } catch (error) {
      return {
        isConfigured: false,
        isWorking: false,
        keyStatus: "unknown",
        saltStatus: "unknown",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
