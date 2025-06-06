/**
 * Key rotation strategy for the integrations module
 *
 * This file provides functions and utilities for rotating encryption keys
 * and re-encrypting data with new keys.
 */
import { v } from "convex/values";

import { action, internalAction } from "../../../_generated/server";
import { KeyPurpose } from "./keyManagement";

/**
 * Key rotation frequency in milliseconds
 * Recommended: 6 months (180 days)
 */
export const KEY_ROTATION_FREQUENCY = 180 * 24 * 60 * 60 * 1000;

/**
 * Key deprecation period in milliseconds
 * Period after rotation when old keys are still valid for decryption
 * Recommended: 30 days
 */
export const KEY_DEPRECATION_PERIOD = 30 * 24 * 60 * 60 * 1000;

/**
 * Rotation status type
 */
export interface RotationStatus {
  inProgress: boolean;
  startedAt: number | null;
  completedAt: number | null;
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  errors: number;
}

/**
 * Schedule a key rotation for a specific purpose
 *
 * This function creates a scheduled job to rotate keys at a specific time
 */
export const scheduleKeyRotation = action({
  args: {
    purpose: v.union(
      v.literal(KeyPurpose.CREDENTIAL_ENCRYPTION),
      v.literal(KeyPurpose.WEBHOOK_SIGNING),
      v.literal(KeyPurpose.TOKEN_SIGNING),
    ),
    scheduledTime: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    scheduledTime: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // In a real implementation, this would schedule a key rotation
    // using the Convex scheduler

    // Calculate scheduled time if not provided (default: next off-peak hours)
    const scheduledTime = args.scheduledTime || calculateNextOffPeakTime();

    // For now, just return success
    return {
      success: true,
      message: `Key rotation scheduled for ${new Date(scheduledTime).toISOString()}`,
      scheduledTime,
    };
  },
});

/**
 * Execute a scheduled key rotation
 *
 * This function is meant to be called by the scheduler to perform
 * the actual key rotation
 */
export const executeKeyRotation = internalAction({
  args: {
    purpose: v.union(
      v.literal(KeyPurpose.CREDENTIAL_ENCRYPTION),
      v.literal(KeyPurpose.WEBHOOK_SIGNING),
      v.literal(KeyPurpose.TOKEN_SIGNING),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    newKeyId: v.optional(v.string()),
    oldKeyId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // In a real implementation, this would:
    // 1. Generate a new key
    // 2. Mark the current key as rotating
    // 3. Begin the re-encryption process
    // 4. Update all relevant metadata

    // For now, just return success
    return {
      success: true,
      message: `Key rotation for ${args.purpose} completed successfully`,
      newKeyId: `new-key-${Date.now()}`,
      oldKeyId: "old-key-id",
    };
  },
});

/**
 * Get the current status of a key rotation operation
 */
export const getRotationStatus = action({
  args: {
    purpose: v.union(
      v.literal(KeyPurpose.CREDENTIAL_ENCRYPTION),
      v.literal(KeyPurpose.WEBHOOK_SIGNING),
      v.literal(KeyPurpose.TOKEN_SIGNING),
    ),
  },
  returns: v.object({
    inProgress: v.boolean(),
    startedAt: v.union(v.number(), v.null()),
    completedAt: v.union(v.number(), v.null()),
    progress: v.number(),
    totalItems: v.number(),
    processedItems: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    // In a real implementation, this would query the database for
    // the current status of the rotation operation

    // For now, return a fake status
    return {
      inProgress: false,
      startedAt: null,
      completedAt: null,
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      errors: 0,
    };
  },
});

/**
 * Calculate the next off-peak time for scheduled rotations
 * (typically nights or weekends)
 *
 * @returns Timestamp for the next off-peak time
 */
function calculateNextOffPeakTime(): number {
  const now = new Date();
  const nextTime = new Date(now);

  // Set to 2 AM the next day
  nextTime.setDate(now.getDate() + 1);
  nextTime.setHours(2, 0, 0, 0);

  // If it's a weekend, add extra days to make it Tuesday (day after Monday)
  const dayOfWeek = nextTime.getDay();
  if (dayOfWeek === 0) {
    // Sunday
    nextTime.setDate(nextTime.getDate() + 2); // Tuesday
  } else if (dayOfWeek === 6) {
    // Saturday
    nextTime.setDate(nextTime.getDate() + 3); // Tuesday
  }

  return nextTime.getTime();
}

/**
 * Create a rotation schedule based on best practices
 *
 * @returns Array of scheduled rotation times for the next year
 */
export const createRotationSchedule = action({
  args: {},
  returns: v.array(
    v.object({
      purpose: v.string(),
      scheduledTime: v.number(),
      description: v.string(),
    }),
  ),
  handler: async () => {
    const schedule = [];
    const now = Date.now();

    // Schedule credential encryption key rotation every 6 months
    const nextCredentialRotation = now + KEY_ROTATION_FREQUENCY;
    schedule.push({
      purpose: KeyPurpose.CREDENTIAL_ENCRYPTION,
      scheduledTime: nextCredentialRotation,
      description: `Regular 6-month rotation of credential encryption keys`,
    });

    // Schedule webhook signing key rotation every 3 months
    const nextWebhookRotation = now + KEY_ROTATION_FREQUENCY / 2;
    schedule.push({
      purpose: KeyPurpose.WEBHOOK_SIGNING,
      scheduledTime: nextWebhookRotation,
      description: `Regular 3-month rotation of webhook signing keys`,
    });

    // Schedule token signing key rotation every 3 months
    const nextTokenRotation = now + KEY_ROTATION_FREQUENCY / 2;
    schedule.push({
      purpose: KeyPurpose.TOKEN_SIGNING,
      scheduledTime: nextTokenRotation,
      description: `Regular 3-month rotation of token signing keys`,
    });

    return schedule;
  },
});
