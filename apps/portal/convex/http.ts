import {
  createMediaFromWebhook,
  uploadMediaOptions,
  uploadMediaPost,
} from "./core/media/http";

import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { supportEmailInbound } from "./plugins/support/http";

const internalAny = internal as Record<string, any>;

/**
 * Request body structure expected by the createAuthNetTransaction endpoint.
 */
interface CreateTransactionRequestBody {
  opaqueData?: {
    dataDescriptor: string;
    dataValue: string;
  };
  amount: number; // Required amount in cents
  paymentMethod: string; // Required payment method identifier
  lineItems: {
    // Use T[] format for array type
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

/**
 * Creates common CORS headers for HTTP responses.
 * Reads the allowed origin from the CLIENT_ORIGIN environment variable
 * set in the Convex dashboard.
 * @returns {HeadersInit} Object containing CORS headers.
 */
const createCorsHeaders = () => ({
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- CLIENT_ORIGIN is set in Convex dashboard, not turbo.json
  "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

const defaultPortalOrigin =
  process.env.CLIENT_ORIGIN ?? "http://localhost:3024";

const sanitizeOrigin = (rawOrigin: string | null): string => {
  if (!rawOrigin) return defaultPortalOrigin;
  try {
    const decoded = decodeURIComponent(rawOrigin);
    const parsed = new URL(decoded);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return defaultPortalOrigin;
  }
};

const buildPortalCallbackUrl = (origin: string) => {
  const destination = new URL("/admin/media/settings", origin);
  destination.searchParams.set("tab", "vimeo");
  return destination;
};

const resolveVimeoClientId = () =>
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.NEXT_PUBLIC_VIMEO_CLIENT_ID ??
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.VIMEO_CLIENT_ID ??
  "";

const VIMEO_SCOPE = "public private video_files";

/**
 * HTTP action handler for creating an Authorize.Net transaction.
 * Parses the request body, calls the internal action `internalCreateAuthNetTransaction`,
 * and returns an HTTP response with appropriate status and CORS headers.
 *
 * @param ctx - Convex httpAction context, includes `runAction`.
 * @param request - The incoming Fetch API Request object.
 * @returns A Fetch API Response object.
 */
const createAuthNetTransactionHttpAction = httpAction(async (ctx, request) => {
  try {
    // 1. Parse and Validate Request Body
    const body = (await request.json()) as CreateTransactionRequestBody;
    // Destructure top-level properties
    const { amount, paymentMethod, lineItems, opaqueData } = body;

    // Validate opaqueData existence and its properties separately
    const opaqueDataDescriptor = opaqueData?.dataDescriptor;
    const opaqueDataValue = opaqueData?.dataValue;

    if (
      !opaqueData || // Explicitly check if opaqueData exists
      !opaqueDataDescriptor ||
      !opaqueDataValue ||
      typeof amount !== "number" ||
      amount <= 0 ||
      typeof paymentMethod !== "string" ||
      paymentMethod.trim() === "" ||
      !Array.isArray(lineItems) ||
      lineItems.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid request body payload" }),
        {
          status: 400,
          headers: {
            ...createCorsHeaders(),
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 2. Schedule the internal action (opaqueData is guaranteed to exist here)
    await ctx.scheduler.runAfter(
      0,
      internalAny.actions.payments.internalCreateAuthNetTransaction,
      {
        // Pass validated properties
        opaqueDataDescriptor: opaqueDataDescriptor,
        opaqueDataValue: opaqueDataValue,
        amount: amount,
        paymentMethod: paymentMethod,
        lineItems: lineItems,
      },
    );

    // 3. Return success immediately
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...createCorsHeaders(), "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in createAuthNetTransaction httpAction:", error);
    let errorMessage = "Internal Server Error";
    if (error instanceof SyntaxError) {
      errorMessage = "Invalid JSON payload";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...createCorsHeaders(), "Content-Type": "application/json" },
    });
  }
});

// Create an HTTP router using the correct import
const http = httpRouter();

const allowedOrigin = "*";

const corsPreflight = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
});

const startVimeoOAuth = httpAction(async (_, request) => {
  const requestUrl = new URL(request.url);
  const clientId = resolveVimeoClientId();
  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "Vimeo client credentials not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const baseOrigin = sanitizeOrigin(requestUrl.searchParams.get("origin"));
  const redirectUri = `${requestUrl.origin}/api/integrations/vimeo`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: VIMEO_SCOPE,
    state: baseOrigin,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://api.vimeo.com/oauth/authorize?${params.toString()}`,
    },
  });
});

const relayVimeoOAuth = httpAction(async (_, request) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const state = requestUrl.searchParams.get("state");

  const baseOrigin = sanitizeOrigin(state);
  const destination = buildPortalCallbackUrl(baseOrigin);

  if (code) {
    destination.searchParams.set("code", code);
  }

  if (error) {
    destination.searchParams.set("error", error);
    if (errorDescription) {
      destination.searchParams.set("error_description", errorDescription);
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination.toString(),
    },
  });
});

http.route({
  path: "/healthz",
  method: "GET",
  handler: httpAction(async () => new Response("ok")),
});

http.route({
  path: "/api/support/email/inbound",
  method: "POST",
  handler: supportEmailInbound,
});

http.route({
  path: "/api/support/email/inbound",
  method: "OPTIONS",
  handler: corsPreflight,
});

http.route({
  path: "/createAuthNetTransaction",
  method: "POST",
  handler: createAuthNetTransactionHttpAction, // Use the defined action function
});

http.route({
  path: "/createAuthNetTransaction",
  method: "OPTIONS",
  handler: corsPreflight,
});

// ---- Lessons webhook ----
// http.route({
//   path: "/lessons",
//   method: "POST",
//   handler: httpAction(async (ctx, req) => {
//     try {
//       const json = await req.json();
//       const lessonId = await ctx.runMutation(
//         api.lms.lessons.mutations.createViaWebhook,
//         json,
//       );
//       return new Response(JSON.stringify({ lessonId }), {
//         status: 201,
//         headers: { ...createCorsHeaders(), "Content-Type": "application/json" },
//       });
//     } catch (err) {
//       return new Response(JSON.stringify({ error: (err as Error).message }), {
//         status: 400,
//         headers: { ...createCorsHeaders(), "Content-Type": "application/json" },
//       });
//     }
//   }),
// });

http.route({
  path: "/uploadMedia",
  method: "POST",
  handler: uploadMediaPost,
});

http.route({
  path: "/uploadMedia",
  method: "OPTIONS",
  handler: uploadMediaOptions,
});

http.route({
  path: "/webhook/media",
  method: "POST",
  handler: createMediaFromWebhook,
});

http.route({
  path: "/api/integrations/vimeo",
  method: "GET",
  handler: relayVimeoOAuth,
});

http.route({
  path: "/api/integrations/vimeo/start",
  method: "GET",
  handler: startVimeoOAuth,
});

// Webhook endpoint removed - was dependent on apps system which has been removed
// New webhook system will be implemented based on node types and connections

/**
 * Health check endpoint for monitoring
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      // Basic health checks
      const startTime = Date.now();

      // Test database connectivity by running a simple query
      const dbCheck = await ctx.runQuery(
        internalAny.integrations.scenarios.queries.getScenarios,
        { limit: 1 },
      );

      const responseTime = Date.now() - startTime;

      // Get system stats
      const uptime =
        typeof process.uptime === "function" ? process.uptime() : "unknown";
      const stats = {
        timestamp: Date.now(),
        uptime,
        responseTime,
        version: "1.0.0",
      };

      return new Response(
        JSON.stringify({
          status: "healthy",
          checks: {
            database: dbCheck !== null,
            responseTime: responseTime < 5000, // Less than 5 seconds
          },
          stats,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Health check error:", error);
      return new Response(
        JSON.stringify({
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }),
});

/**
 * System info endpoint (for debugging)
 */
http.route({
  path: "/system/info",
  method: "GET",
  handler: httpAction(async () => {
    try {
      // Get system information
      const info = {
        version: "1.0.0",
        timestamp: Date.now(),
        environment: process.env.NODE_ENV ?? "unknown",
        endpoints: [
          {
            path: "/webhook/:appKey",
            method: "POST",
            description: "Receive webhooks",
          },
          { path: "/health", method: "GET", description: "Health check" },
          {
            path: "/system/info",
            method: "GET",
            description: "System information",
          },
        ],
      };

      return new Response(JSON.stringify(info), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }),
});

/**
 * Manual trigger endpoint for testing scenarios
 * POST /trigger/:scenarioId
 */
http.route({
  path: "/trigger/:scenarioId",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Extract scenario ID from URL
      const url = new URL(request.url);
      const scenarioId = url.pathname.split("/").pop();

      if (!scenarioId) {
        return new Response(JSON.stringify({ error: "Missing scenario ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse payload
      let payload = {};
      try {
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          payload = await request.json();
        } else {
          const text = await request.text();
          if (text) {
            payload = { data: text };
          }
        }
      } catch (_error) {
        payload = {};
      }

      // Trigger the scenario manually
      const result = await ctx.runAction(
        internalAny.integrations.webhooks.handler.triggerScenarioManually,
        {
          scenarioId: scenarioId as Id<"scenarios">,
          payload,
        },
      );

      if (!result.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.error,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          runId: result.runId,
          executionResult: result.executionResult,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Manual trigger error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Internal server error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }),
});

// Export the router as the default export
export default http;
