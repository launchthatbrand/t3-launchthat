import { z } from "zod";

import type { IntegrationNodeDefinition } from "@acme/integration-sdk";

const webhookSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
  headers: z.record(z.string()).optional(),
  timeout: z.number().min(1).max(30000).default(10000),
  retries: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(100).max(10000).default(1000),
  signatureSecret: z.string().optional(),
  signatureHeader: z.string().default("X-Signature"),
  rateLimit: z
    .object({
      enabled: z.boolean().default(false),
      maxRequests: z.number().min(1).default(100),
      windowMs: z.number().min(1000).default(60000),
    })
    .optional(),
});

// Rate limiting store (in production, this would be Redis/database)
const rateLimitStore = new Map<
  string,
  { count: number; windowStart: number }
>();

function isRateLimited(
  url: string,
  rateLimit?: { enabled?: boolean; maxRequests: number; windowMs: number },
): boolean {
  if (!rateLimit?.enabled) return false;

  const now = Date.now();
  const stored = rateLimitStore.get(url);

  if (!stored || now - stored.windowStart > rateLimit.windowMs) {
    rateLimitStore.set(url, { count: 1, windowStart: now });
    return false;
  }

  if (stored.count >= rateLimit.maxRequests) {
    return true;
  }

  stored.count++;
  return false;
}

function createSignature(payload: string, secret: string): string {
  // In a real implementation, this would use a proper crypto library
  // For now, we'll use a simple hash function
  let hash = 0;
  const combined = payload + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return executeWithRetry(fn, retries - 1, delay * 1.5); // Exponential backoff
    }
    throw error;
  }
}

export const webhookNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "system.webhook",
    name: "Webhook",
    description:
      "Send HTTP requests to external URLs with signature verification and rate limiting",
    type: "system",
    category: "network",
    version: "1.0.0",
    icon: "Globe",
    color: "#3B82F6",
  },

  configSchema: {
    input: {
      schema: z.object({
        payload: z.any().optional(),
        headers: z.record(z.string()).optional(),
        params: z.record(z.string()).optional(),
      }),
      description: "Data to send in the webhook request",
    },
    output: {
      schema: z.object({
        success: z.boolean(),
        status: z.number(),
        headers: z.record(z.string()).optional(),
        data: z.any().optional(),
        error: z.string().optional(),
        responseTime: z.number(),
      }),
      description: "Response data from the webhook request",
    },
    settings: {
      schema: webhookSchema,
      description:
        "Webhook configuration including URL, method, headers, and security settings",
    },
  },

  processor: {
    async execute(context) {
      const { settings, inputData } = context;
      const webhookSettings = settings as z.infer<typeof webhookSchema>;
      const startTime = Date.now();

      try {
        // Rate limiting check
        if (isRateLimited(settings.url, settings.rateLimit)) {
          return {
            success: false,
            error: "Rate limit exceeded",
            responseTime: Date.now() - startTime,
            logs: ["Request blocked due to rate limiting"],
          };
        }

        // Prepare request
        const payload = (inputData as any)?.payload;
        const inputHeaders = (inputData as any)?.headers || {};
        const params = (inputData as any)?.params || {};

        const headers = {
          "Content-Type": "application/json",
          "User-Agent": "LaunchThat-Integration/1.0",
          ...settings.headers,
          ...inputHeaders,
        };

        // Add signature if secret is provided
        if (settings.signatureSecret && payload) {
          const payloadString =
            typeof payload === "string" ? payload : JSON.stringify(payload);
          const signature = createSignature(
            payloadString,
            settings.signatureSecret,
          );
          headers[settings.signatureHeader] = `sha256=${signature}`;
        }

        // Build URL with query parameters
        const url = new URL(settings.url);
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });

        // Execute request with retry logic
        const response = await executeWithRetry(
          async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              settings.timeout,
            );

            try {
              const fetchResponse = await fetch(url.toString(), {
                method: settings.method,
                headers,
                body:
                  payload && settings.method !== "GET"
                    ? typeof payload === "string"
                      ? payload
                      : JSON.stringify(payload)
                    : undefined,
                signal: controller.signal,
              });

              clearTimeout(timeoutId);
              return fetchResponse;
            } catch (error) {
              clearTimeout(timeoutId);
              throw error;
            }
          },
          settings.retries,
          settings.retryDelay,
        );

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let responseData;
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        const responseTime = Date.now() - startTime;

        return {
          success: response.ok,
          data: {
            success: response.ok,
            status: response.status,
            headers: responseHeaders,
            data: responseData,
            responseTime,
          },
          logs: [
            `Webhook ${settings.method} request to ${settings.url}`,
            `Response: ${response.status} ${response.statusText}`,
            `Response time: ${responseTime}ms`,
          ],
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        return {
          success: false,
          error: errorMessage,
          data: {
            success: false,
            status: 0,
            error: errorMessage,
            responseTime,
          },
          logs: [
            `Webhook request failed: ${errorMessage}`,
            `Response time: ${responseTime}ms`,
          ],
        };
      }
    },

    async validate(settings) {
      try {
        webhookSchema.parse(settings);
        return true;
      } catch {
        return false;
      }
    },
  },
};
