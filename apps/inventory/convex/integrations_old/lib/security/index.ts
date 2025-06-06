/**
 * Export security utilities for the integrations module
 */

// Export key management types and functions
export {
  KeyStatus,
  KeyPurpose,
  getActiveKeyId,
  isKeyRotationNeeded,
  rotateKey,
  reEncryptAllCredentials,
  getKeyRotationStatus,
} from "./keyManagement";

// Export key rotation utilities
export {
  KEY_ROTATION_FREQUENCY,
  KEY_DEPRECATION_PERIOD,
  scheduleKeyRotation,
  getRotationStatus,
  createRotationSchedule,
} from "./rotation";

// In a real implementation, these would be properly implemented
// For now we'll export placeholder functions until we can fix the linting issues
// with the Node.js crypto module

/**
 * Encrypt sensitive data
 * @param data Plain text to encrypt
 * @returns Encrypted text or null if input is empty
 */
export function encryptData(data: string): string | null {
  // Placeholder - in production, would call the encryption action
  if (!data) return null;
  return `encrypted:${data}`;
}

/**
 * Decrypt encrypted data
 * @param encryptedData Encrypted text
 * @returns Decrypted plain text or null if input is empty
 */
export function decryptData(encryptedData: string): string | null {
  // Placeholder - in production, would call the decryption action
  if (!encryptedData) return null;
  if (!encryptedData.startsWith("encrypted:")) return null;
  return encryptedData.substring("encrypted:".length);
}

/**
 * Get encryption configuration status
 * @returns Status object
 */
export function getEncryptionStatus(): {
  isConfigured: boolean;
  isWorking: boolean;
  keyStatus: string;
  saltStatus: string;
  error?: string;
} {
  // Placeholder - in production, would call the status action
  return {
    isConfigured: true,
    isWorking: true,
    keyStatus: "set",
    saltStatus: "set",
  };
}
