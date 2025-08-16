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
    headers: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
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
    headers: v.any(),
    connectionId: v.optional(v.id("connections")),
  },
  returns: v.any(),
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
        headersLower["x-idempotency-key"] ??
        headersLower["idempotency-key"] ??
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
      const normalizedPayload = normalizeWebhookPayload(
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
        matchingScenarios.map(async (scenario: any) => {
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
function normalizeWebhookPayload(triggerKey: string, rawPayload: any): any {
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

/**
 * Send a webhook to a specified URL with custom configuration
 */
export const sendWebhook = action({
  args: {
    webhookUrl: v.string(),
    payload: v.any(),
    secret: v.optional(v.string()),
    headers: v.optional(v.any()),
    retryAttempts: v.optional(v.number()),
    timeout: v.optional(v.number()),
    eventType: v.optional(v.string()),
    method: v.optional(v.string()),
    contentType: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const webhookUrl = args.webhookUrl;
    const payload: unknown = args.payload;
    const secret = args.secret;
    const headers: Record<string, string> =
      (args.headers as Record<string, string> | undefined) ?? {};
    const retryAttempts = args.retryAttempts ?? 3;
    const timeout = args.timeout ?? 30000;
    const eventType = args.eventType ?? "webhook";
    const method = args.method ?? "POST";
    const contentType = args.contentType ?? "application/json";

    const timestamp = Date.now();

    // Prepare request headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "User-Agent": "Portal-Webhooks/1.0",
      ...headers,
    };

    // Add signature if secret is provided
    if (secret) {
      try {
        const hmac = createHmac("sha256", secret);
        hmac.update(JSON.stringify(payload));
        requestHeaders["X-Portal-Signature"] = `sha256=${hmac.digest("hex")}`;
      } catch (error) {
        console.warn("Failed to create webhook signature:", error);
      }
    }

    // Add event type header
    if (eventType) {
      requestHeaders["X-Portal-Event"] = eventType;
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < retryAttempts) {
      attempt++;

      try {
        console.log(
          `Sending webhook (attempt ${attempt}/${retryAttempts}) to: ${webhookUrl}`,
        );

        // Prepare request body
        let body: string;
        if (contentType === "application/json") {
          body = JSON.stringify(payload);
        } else {
          body = String(payload);
        }

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(webhookUrl, {
          method: method.toUpperCase(),
          headers: requestHeaders,
          body: method.toUpperCase() === "GET" ? undefined : body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();

        // Convert response headers to plain object
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const result = {
          success: response.ok,
          statusCode: response.status,
          statusText: response.statusText,
          responseBody: responseText,
          responseHeaders,
          timestamp,
        };

        if (response.ok) {
          console.log(
            `Webhook sent successfully: ${response.status} ${response.statusText}`,
          );
          return result;
        } else {
          console.log(
            `Webhook failed: ${response.status} ${response.statusText}`,
          );
          // If it's a 4xx error, don't retry
          if (response.status >= 400 && response.status < 500) {
            return {
              ...result,
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
          }
          // For 5xx errors, continue to retry
          lastError = new Error(
            `HTTP ${response.status}: ${response.statusText}`,
          );
        }
      } catch (error) {
        console.error(`Webhook attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on network timeout or abort
        if (
          lastError.name === "AbortError" ||
          lastError.message.includes("timeout")
        ) {
          break;
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retryAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All attempts failed
    return {
      success: false,
      error: lastError?.message ?? "Unknown error occurred",
      timestamp,
    };
  },
});

/**
 * Test webhook action for frontend testing
 */
export const testWebhook = action({
  args: {
    webhookUrl: v.string(),
    method: v.optional(v.string()),
    contentType: v.optional(v.string()),
    requestBody: v.optional(v.string()),
    headers: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const {
      webhookUrl,
      method = "POST",
      contentType = "application/json",
      requestBody = "{}",
      headers = [],
    } = args;

    const startTime = Date.now();

    try {
      // Prepare request headers
      const requestHeaders: Record<string, string> = {
        "Content-Type": contentType,
        "User-Agent": "Portal-Webhook-Tester/1.0",
      };

      // Add custom headers
      (headers as any[]).forEach(({ key, value }: any) => {
        if (key && value) {
          requestHeaders[key] = value;
        }
      });

      // Prepare request body
      let body: string | undefined;
      if (method.toUpperCase() !== "GET" && method.toUpperCase() !== "HEAD") {
        body = requestBody;
      }

      console.log(`Testing webhook: ${method} ${webhookUrl}`);

      const response = await fetch(webhookUrl, {
        method: method.toUpperCase(),
        headers: requestHeaders,
        body,
      });

      const responseText = await response.text();

      // Convert response headers to plain object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const duration = Date.now() - startTime;

      return {
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: responseText,
        responseHeaders,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("Webhook test failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  },
});

/**
 * Send webhook using a connection (with rate limiting and secret management)
 * This is the secure internal action that should be used for actual webhook sending
 */
export const sendWebhookWithConnection = internalAction({
  args: {
    connectionId: v.id("connections"),
    payload: v.any(),
    webhookUrl: v.string(),
    eventType: v.string(),
    retryAttempts: v.optional(v.number()),
    timeout: v.optional(v.number()),
    rateLimit: v.optional(v.any()), // Simplified to avoid type instantiation issues
  },
  returns: v.any(), // Simplified to avoid type instantiation issues
  handler: async (ctx, args) => {
    try {
      // Check rate limit first if specified
      if (args.rateLimit) {
        const rateLimitResult = await ctx.runAction(
          internal.integrations.connections.internalConnections.checkRateLimit,
          {
            connectionId: args.connectionId,
            limit: args.rateLimit.limit,
            windowMs: args.rateLimit.windowMs,
          },
        );

        if (!rateLimitResult.allowed) {
          return {
            success: false,
            error: `Rate limit exceeded. Remaining: ${rateLimitResult.remaining}`,
          };
        }
      }

      // Get decrypted secrets from connection
      const secrets = await ctx.runAction(
        internal.integrations.connections.cryptoActions.getDecryptedSecrets,
        { connectionId: args.connectionId },
      );

      if (!secrets) {
        return {
          success: false,
          error: "Connection secrets not found or could not be decrypted",
        };
      }

      // Get signing secret from connection credentials
      const signingSecret =
        secrets.credentials.secret ?? secrets.credentials.token;

      // Use the existing webhook action but with the secure secret
      return await ctx.runAction(
        internal.integrations.actions.webhooks.sendWebhook,
        {
          webhookUrl: args.webhookUrl,
          payload: args.payload,
          secret: signingSecret,
          retryAttempts: args.retryAttempts ?? 3,
          timeout: args.timeout ?? 30000,
          eventType: args.eventType,
        },
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Simplified schemas to avoid type instantiation issues
export const WebhookConfigSchema = z.object({
  secret: z.string().optional(),
  headers: z.record(z.string()).optional(),
  retryAttempts: z.number().optional(),
  timeout: z.number().optional(),
  eventType: z.string().optional(),
  method: z.string().optional(),
  contentType: z.string().optional(),
});

const WebhookInputSchema = z.object({
  webhookUrl: z.string().url(),
  payload: z.unknown(),
});

const WebhookOutputSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
  statusText: z.string().optional(),
  responseBody: z.string().optional(),
  responseHeaders: z.record(z.string()).optional(),
  error: z.string().optional(),
  timestamp: z.number(),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
export type WebhookInput = z.infer<typeof WebhookInputSchema>;
export type WebhookOutput = z.infer<typeof WebhookOutputSchema>;

const webhookAction: ActionDefinition<unknown, unknown, unknown> = {
  type: "webhooks.send",
  metadata: {
    name: "Send Webhook",
    description: "Send a webhook to a specified URL with custom configuration",
    category: "webhooks",
  },
  configSchema: WebhookConfigSchema as unknown as z.ZodType<unknown>,
  inputSchema: WebhookInputSchema as unknown as z.ZodType<unknown>,
  outputSchema: WebhookOutputSchema as unknown as z.ZodType<unknown>,
  execute: async (
    _ctx: ActionContext,
    input: unknown,
    config: unknown,
  ): Promise<ActionResult<unknown>> => {
    const cfg = validateWithSchema(
      WebhookConfigSchema as unknown as z.ZodType<unknown>,
      config,
    ) as WebhookConfig;
    const inp = validateWithSchema(
      WebhookInputSchema as unknown as z.ZodType<unknown>,
      input,
    ) as WebhookInput;

    const timestamp = Date.now();

    try {
      const headers: Record<string, string> = {
        "Content-Type": cfg.contentType ?? "application/json",
        "User-Agent": "Portal-Webhooks/1.0",
        ...(cfg.headers ?? {}),
      };

      if (cfg.secret) {
        const hmac = createHmac("sha256", cfg.secret);
        hmac.update(JSON.stringify(inp.payload));
        headers["X-Portal-Signature"] = `sha256=${hmac.digest("hex")}`;
      }

      if (cfg.eventType) headers["X-Portal-Event"] = cfg.eventType;

      const method = (cfg.method ?? "POST").toUpperCase();
      const body =
        headers["Content-Type"] === "application/json"
          ? JSON.stringify(inp.payload)
          : String(inp.payload);

      const controller = new AbortController();
      const timeoutMs = cfg.timeout ?? 30000;
      const toId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(inp.webhookUrl, {
        method,
        headers,
        body: method === "GET" ? undefined : body,
        signal: controller.signal,
      });
      clearTimeout(toId);

      const responseText = await response.text();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const data: WebhookOutput = {
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: responseText,
        responseHeaders,
        timestamp,
      };

      if (response.ok) {
        return { kind: "success", data };
      }
      if (response.status >= 400 && response.status < 500) {
        return {
          kind: "fatal_error",
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText,
          },
        };
      }
      return {
        kind: "retryable_error",
        error: {
          code: `HTTP_${response.status}`,
          message: response.statusText,
        },
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        kind: "retryable_error",
        error: { code: "NETWORK_ERROR", message },
      };
    }
  },
};

export const registerWebhookAction = actionRegistry.register(
  webhookAction.type,
  webhookAction,
);
