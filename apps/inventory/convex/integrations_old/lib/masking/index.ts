/**
 * Data masking and tokenization utilities for the integrations module
 *
 * This file provides functions for masking and tokenizing sensitive data
 * to protect it in non-production environments and during processing.
 */
import { v } from "convex/values";

import { security } from "..";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../../../_generated/server";

/**
 * Masking types
 */
export enum MaskingType {
  // Full masking (hide entire value)
  FULL = "full",

  // Partial masking (show portions)
  FIRST_4_LAST_4 = "first4last4", // Show first 4 and last 4 chars
  LAST_4 = "last4", // Show only last 4 chars
  FIRST_2_LAST_2 = "first2last2", // Show first 2 and last 2 chars

  // Format-specific masking
  EMAIL = "email", // Mask email (show first char of local part + domain)
  PHONE = "phone", // Mask phone (show only last 4 digits)
  NAME = "name", // Mask name (show only first initial + last initial)
  ADDRESS = "address", // Mask address (show only city/state/zip)

  // Special types
  TOKENIZE = "tokenize", // Replace with a token
  HASH = "hash", // One-way hash the value
}

/**
 * Masking direction
 */
export enum MaskingDirection {
  MASK = "mask", // Convert real value to masked value
  UNMASK = "unmask", // Convert masked value to real value (if reversible)
}

/**
 * Tokenization vault entry
 */
interface TokenVaultEntry {
  token: string;
  value: string;
  createdAt: number;
  expiresAt?: number;
  usageCount: number;
  lastUsed?: number;
}

/**
 * Mask sensitive data based on the specified masking type
 *
 * @param value Value to mask
 * @param type Masking type to apply
 * @returns Masked value
 */
export function maskValue(value: string, type: MaskingType): string {
  if (!value) return "";

  switch (type) {
    case MaskingType.FULL:
      return "********";

    case MaskingType.LAST_4:
      if (value.length <= 4) return value;
      return "".padStart(value.length - 4, "*") + value.slice(-4);

    case MaskingType.FIRST_4_LAST_4:
      if (value.length <= 8) return value;
      return (
        value.slice(0, 4) + "".padStart(value.length - 8, "*") + value.slice(-4)
      );

    case MaskingType.FIRST_2_LAST_2:
      if (value.length <= 4) return value;
      return (
        value.slice(0, 2) + "".padStart(value.length - 4, "*") + value.slice(-2)
      );

    case MaskingType.EMAIL:
      const emailParts = value.split("@");
      if (emailParts.length !== 2) return value;

      const localPart = emailParts[0];
      const domain = emailParts[1];

      return (
        localPart.charAt(0) +
        "".padStart(localPart.length - 1, "*") +
        "@" +
        domain
      );

    case MaskingType.PHONE:
      // Remove non-numeric characters
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 4) return digitsOnly;

      return "".padStart(digitsOnly.length - 4, "*") + digitsOnly.slice(-4);

    case MaskingType.NAME:
      const nameParts = value.split(" ");
      if (nameParts.length < 2) {
        // Just one word, show first initial
        return (
          nameParts[0].charAt(0) + "".padStart(nameParts[0].length - 1, "*")
        );
      }

      // First name initial + last name initial
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];

      return firstName.charAt(0) + "." + lastName.charAt(0) + ".";

    case MaskingType.ADDRESS:
      // For addresses, we'll just return a placeholder
      // In a real implementation, you might parse the address and only return city/state/zip
      return "[Address Redacted]";

    case MaskingType.HASH:
      // Simple hash for demonstration
      // In production, use a cryptographic hash function
      return hashValue(value);

    default:
      return value;
  }
}

/**
 * Create a simple hash of a value (for demonstration purposes)
 *
 * In production, use a proper cryptographic hash function
 *
 * @param value Value to hash
 * @returns Hashed value
 */
function hashValue(value: string): string {
  // This is just a simple demonstration - NOT secure for production
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Return as hex string
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Tokenize a sensitive value and store in the token vault
 */
export const tokenizeValue = internalAction({
  args: {
    value: v.string(),
    expiresInHours: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { value, expiresInHours } = args;

    if (!value) {
      return "";
    }

    // Generate a secure token
    // In a real implementation, this would use a cryptographically secure method
    // For now, we'll use a simple approach
    const token = generateToken();

    // Calculate expiration if provided
    const expiresAt = expiresInHours
      ? Date.now() + expiresInHours * 60 * 60 * 1000
      : undefined;

    // In a real implementation, we would:
    // 1. Encrypt the value
    // 2. Store it in a secure token vault table
    // 3. Set up expiration/clean-up mechanisms

    // For now, just return the token
    return token;
  },
});

/**
 * Detokenize a value by looking it up in the token vault
 */
export const detokenizeValue = internalAction({
  args: {
    token: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const { token } = args;

    if (!token) {
      return null;
    }

    // In a real implementation, we would:
    // 1. Look up the token in the vault
    // 2. Check if it's expired
    // 3. Decrypt and return the original value
    // 4. Update usage statistics

    // For now, just return a placeholder
    return null;
  },
});

/**
 * Generate a secure random token
 *
 * @returns Random token
 */
function generateToken(): string {
  // In a real implementation, use a cryptographically secure random generator
  // For now, use a simple approach
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const tokenLength = 32;
  let token = "";

  for (let i = 0; i < tokenLength; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `tok_${token}`;
}

/**
 * Mask an entire object's sensitive fields
 *
 * @param obj Object to mask
 * @param fieldMaskingMap Map of field names to masking types
 * @returns Masked object
 */
export function maskObject<T extends Record<string, any>>(
  obj: T,
  fieldMaskingMap: Record<string, MaskingType>,
): T {
  if (!obj) return obj;

  const result = { ...obj };

  // Apply masking to specified fields
  for (const [field, maskType] of Object.entries(fieldMaskingMap)) {
    if (field in result && typeof result[field] === "string") {
      result[field] = maskValue(result[field], maskType);
    }
  }

  return result;
}

/**
 * Apply masking rules to a nested object structure
 */
export const applyDataMasking = internalMutation({
  args: {
    data: v.any(),
    rules: v.array(
      v.object({
        path: v.string(), // Dot notation path (e.g., "user.creditCard.number")
        type: v.union(
          v.literal(MaskingType.FULL),
          v.literal(MaskingType.LAST_4),
          v.literal(MaskingType.FIRST_4_LAST_4),
          v.literal(MaskingType.FIRST_2_LAST_2),
          v.literal(MaskingType.EMAIL),
          v.literal(MaskingType.PHONE),
          v.literal(MaskingType.NAME),
          v.literal(MaskingType.ADDRESS),
          v.literal(MaskingType.TOKENIZE),
          v.literal(MaskingType.HASH),
        ),
      }),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { data, rules } = args;

    if (!data || !rules || rules.length === 0) {
      return data;
    }

    // Create a deep copy of the data
    const result = JSON.parse(JSON.stringify(data));

    // Apply each masking rule
    for (const rule of rules) {
      applyMaskingRule(result, rule.path, rule.type);
    }

    return result;
  },
});

/**
 * Apply a masking rule to a specific path in an object
 *
 * @param obj Object to modify
 * @param path Dot notation path (e.g., "user.creditCard.number")
 * @param maskType Masking type to apply
 */
function applyMaskingRule(obj: any, path: string, maskType: MaskingType): void {
  const parts = path.split(".");
  let current = obj;

  // Navigate to the parent of the target field
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];

    if (current === null || current === undefined) {
      return;
    }

    // Handle array indices in the path (e.g., "users.0.email")
    if (/^\d+$/.test(part) && Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (index >= 0 && index < current.length) {
        current = current[index];
      } else {
        return;
      }
    } else {
      if (!(part in current)) {
        return;
      }
      current = current[part];
    }
  }

  // Get the final field name
  const fieldName = parts[parts.length - 1];

  // Handle array field (e.g., "users.*.email")
  if (fieldName === "*" && Array.isArray(current)) {
    for (let i = 0; i < current.length; i++) {
      if (typeof current[i] === "string") {
        current[i] = maskValue(current[i], maskType);
      }
    }
    return;
  }

  // Handle regular field
  if (
    current &&
    fieldName in current &&
    typeof current[fieldName] === "string"
  ) {
    current[fieldName] = maskValue(current[fieldName], maskType);
  }
}
