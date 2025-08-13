import { v } from "convex/values";

import { action } from "../../_generated/server";

/**
 * Send a webhook to a specified URL with custom configuration
 */
export const sendWebhook = action({
  args: {
    webhookUrl: v.string(),
    payload: v.any(),
    secret: v.optional(v.string()),
    headers: v.optional(v.object({})),
    retryAttempts: v.optional(v.number()),
    timeout: v.optional(v.number()),
    eventType: v.optional(v.string()),
    method: v.optional(v.string()),
    contentType: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    statusCode: v.optional(v.number()),
    statusText: v.optional(v.string()),
    responseBody: v.optional(v.string()),
    responseHeaders: v.optional(v.any()),
    error: v.optional(v.string()),
    timestamp: v.number(),
  }),
  handler: async (ctx, args) => {
    const webhookUrl = args.webhookUrl;
    const payload = args.payload;
    const secret = args.secret;
    const headers = args.headers ?? {};
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
        const crypto = await import("crypto");
        const hmac = crypto.createHmac("sha256", secret);
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
    headers: v.optional(
      v.array(
        v.object({
          key: v.string(),
          value: v.string(),
        }),
      ),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    statusCode: v.optional(v.number()),
    statusText: v.optional(v.string()),
    responseBody: v.optional(v.string()),
    responseHeaders: v.optional(v.any()),
    error: v.optional(v.string()),
    duration: v.number(),
  }),
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
      headers.forEach(({ key, value }) => {
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
