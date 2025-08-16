"use node";

import type {
  ActionContext,
  ActionDefinition,
  ActionResult,
} from "../lib/registries";
import { action, internalAction } from "../../_generated/server";
import { actionRegistry, validateWithSchema } from "../lib/registries";
import { createHmac, timingSafeEqual } from "crypto";

import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { z } from "zod";

/**
 * Configuration interface for webhook validation
 */
interface WebhookValidationConfig {
  secret: string;
  algorithm: string; // default: 'sha256'
  headerName: string; // default: 'X-Signature'
  timestampHeaderName: string; // default: 'X-Timestamp'
  maxReplayWindow: number; // default: 5 minutes in ms
}

/**
 * Validate webhook signature with HMAC and replay protection
 */
export const validateWebhookSignature = internalAction({
  args: {
    connectionId: v.id("connections"),
    payload: v.any(),
    headers: v.object({}),
  },
  returns: v.object({
    valid: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get connection secrets
      const connection = await ctx.runQuery(
        internal.integrations.connections.internalConnections.getRawById,
        { id: args.connectionId },
      );

      if (!connection) {
        return { valid: false, error: "Connection not found" };
      }

      // Get webhook secret from connection secrets
      const secrets = await ctx.runAction(
        internal.integrations.connections.cryptoActions.getDecryptedSecrets,
        { connectionId: args.connectionId },
      );

      if (!secrets?.credentials?.webhookSecret) {
        return { valid: false, error: "Webhook secret not configured" };
      }

      const config: WebhookValidationConfig = {
        secret: secrets.credentials.webhookSecret,
        algorithm: "sha256",
        headerName: "X-Signature",
        timestampHeaderName: "X-Timestamp",
        maxReplayWindow: 5 * 60 * 1000, // 5 minutes
      };

      // Convert headers to lowercase for case-insensitive lookup
      const lowerHeaders: Record<string, string> = {};
      Object.entries(args.headers as Record<string, string>).forEach(
        ([key, value]) => {
          lowerHeaders[key.toLowerCase()] = value;
        },
      );

      // Get signature from headers
      const signature = lowerHeaders[config.headerName.toLowerCase()];
      if (!signature) {
        return { valid: false, error: "Missing signature header" };
      }

      // Get timestamp for replay protection
      const timestamp = lowerHeaders[config.timestampHeaderName.toLowerCase()];
      if (timestamp) {
        const eventTime = parseInt(timestamp, 10);
        const currentTime = Date.now();

        if (isNaN(eventTime)) {
          return { valid: false, error: "Invalid timestamp format" };
        }

        if (currentTime - eventTime > config.maxReplayWindow) {
          return {
            valid: false,
            error: "Webhook replay detected (expired timestamp)",
          };
        }
      }

      // Compute expected signature
      const payloadString =
        typeof args.payload === "string"
          ? args.payload
          : JSON.stringify(args.payload);

      const hmac = createHmac(config.algorithm, config.secret);
      hmac.update(payloadString);
      if (timestamp) {
        hmac.update(timestamp);
      }
      const expectedSignature = `${config.algorithm}=${hmac.digest("hex")}`;

      // Compare signatures using constant-time comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (signatureBuffer.length !== expectedBuffer.length) {
        return { valid: false, error: "Invalid signature" };
      }

      const valid = timingSafeEqual(signatureBuffer, expectedBuffer);

      return {
        valid,
        error: valid ? undefined : "Invalid signature",
      };
    } catch (error) {
      console.error("Webhook signature validation error:", error);
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : "Signature validation failed",
      };
    }
  },
});

/**
 * Process inbound webhook with hardening and validation
 */
export const processInboundWebhook = internalAction({
  args: {
    appId: v.id("apps"),
    triggerKey: v.string(),
    payload: v.any(),
    headers: v.object({}),
    connectionId: v.optional(v.id("connections")),
  },
  returns: v.object({
    success: v.boolean(),
    idempotent: v.optional(v.boolean()),
    runId: v.optional(v.id("scenarioRuns")),
    status: v.optional(v.string()),
    scenariosExecuted: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Extract idempotency key from headers or payload
      const headersLower: Record<string, string> = {};
      Object.entries(args.headers as Record<string, string>).forEach(
        ([key, value]) => {
          headersLower[key.toLowerCase()] = value;
        },
      );

      const idempotencyKey =
        headersLower["x-idempotency-key"] ||
        headersLower["idempotency-key"] ||
        (args.payload?.id ? `${args.triggerKey}:${args.payload.id}` : null);

      if (!idempotencyKey) {
        return { success: false, error: "Missing idempotency key" };
      }

      // Check if this webhook has already been processed
      const existingRun = await ctx.runQuery(
        internal.integrations.scenarioRuns.queries.getScenarioRunByCorrelation,
        { correlationId: idempotencyKey },
      );

      if (existingRun) {
        // Return the existing run details instead of processing again
        return {
          success: true,
          idempotent: true,
          runId: existingRun._id,
          status: existingRun.status,
        };
      }

      // Validate signature if connection is provided
      if (args.connectionId) {
        const validationResult = await ctx.runAction(
          internal.integrations.actions.webhooks.validateWebhookSignature,
          {
            connectionId: args.connectionId,
            payload: args.payload,
            headers: args.headers,
          },
        );

        if (!validationResult.valid) {
          return { success: false, error: validationResult.error };
        }
      }

      // Normalize payload to typed shape before processing
      const normalizedPayload = await normalizeWebhookPayload(
        ctx,
        args.triggerKey,
        args.payload,
      );

      // Generate correlation ID for tracking
      const correlationId = generateCorrelationId(idempotencyKey);

      // Find matching scenarios
      const matchingScenarios = await ctx.runQuery(
        internal.integrations.scenarios.queries.findByTriggerKey,
        { triggerKey: args.triggerKey },
      );

      if (matchingScenarios.length === 0) {
        return {
          success: false,
          error: `No scenarios found for trigger key: ${args.triggerKey}`,
        };
      }

      // Create scenario runs for each matching scenario
      const results = await Promise.all(
        matchingScenarios.map(async (scenario) => {
          // Create a run for this scenario
          const runId = await ctx.runMutation(
            internal.integrations.scenarioRuns.mutations.createScenarioRun,
            {
              scenarioId: scenario._id,
              triggerKey: args.triggerKey,
              connectionId: args.connectionId,
              correlationId,
              payload: normalizedPayload,
            },
          );

          return { scenarioId: scenario._id, runId };
        }),
      );

      return {
        success: true,
        idempotent: false,
        runId: results[0]?.runId, // Return the first run ID for compatibility
        scenariosExecuted: results.length,
      };
    } catch (error) {
      console.error("Inbound webhook processing error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      };
    }
  },
});

/**
 * Helper to normalize webhook payloads based on trigger type
 */
async function normalizeWebhookPayload(
  ctx: any,
  triggerKey: string,
  rawPayload: any,
) {
  // For now, return the payload as-is since we don't have trigger schemas defined yet
  // In the future, this could validate against trigger-specific schemas
  try {
    // Basic validation - ensure it's a valid object
    if (typeof rawPayload === "string") {
      return JSON.parse(rawPayload);
    }

    if (typeof rawPayload === "object" && rawPayload !== null) {
      return rawPayload;
    }

    // Wrap primitive values in an object
    return { value: rawPayload };
  } catch (error) {
    throw new Error(
      `Invalid payload for trigger ${triggerKey}: ${error instanceof Error ? error.message : "Invalid JSON"}`,
    );
  }
}

/**
 * Helper to generate a correlation ID
 */
function generateCorrelationId(idempotencyKey?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);

  if (idempotencyKey) {
    // Create a deterministic correlation ID based on the idempotency key
    const hash = createHmac("sha256", "correlation-salt")
      .update(idempotencyKey)
      .digest("hex")
      .substring(0, 8);
    return `corr_${timestamp}_${hash}`;
  }

  return `corr_${timestamp}_${random}`;
}
