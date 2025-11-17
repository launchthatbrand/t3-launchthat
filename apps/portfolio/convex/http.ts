// Keep httpAction import from generated server

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// Correct import for httpRouter according to docs
import { httpRouter } from "convex/server";

import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import {
  createMediaFromWebhook,
  uploadMediaOptions,
  uploadMediaPost,
} from "./core/media/http";

/**
 * Request body structure expected by the createAuthNetTransaction endpoint.
 */
interface CreateTransactionRequestBody {
  opaqueData: {
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
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports, turbo/no-undeclared-env-vars -- CLIENT_ORIGIN is set in Convex dashboard, not turbo.json
  "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

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
      internal.actions.payments.internalCreateAuthNetTransaction,
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

// Define routes
// Example: POST /createAuthNetTransaction will call our action
// Remove eslint-disable comments here, covered by file-level disable
http.route({
  path: "/createAuthNetTransaction",
  method: "POST",
  handler: createAuthNetTransactionHttpAction, // Use the defined action function
});

// Handle OPTIONS preflight requests for CORS
http.route({
  path: "/createAuthNetTransaction",
  method: "OPTIONS",
  // Wrap the handler in httpAction and make it async to satisfy the type signature
  // eslint-disable-next-line @typescript-eslint/require-await -- Required by httpAction type, even if no await is present
  handler: httpAction(async () => {
    // Return the standard preflight response
    return new Response(null, {
      status: 204,
      headers: createCorsHeaders(),
    });
  }),
});

// ---- Lessons webhook ----
http.route({
  path: "/lessons",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const json = await req.json();
      const lessonId = await ctx.runMutation(
        api.lms.lessons.mutations.createViaWebhook,
        json,
      );
      return new Response(JSON.stringify({ lessonId }), {
        status: 201,
        headers: { ...createCorsHeaders(), "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: (err as Error).message }), {
        status: 400,
        headers: { ...createCorsHeaders(), "Content-Type": "application/json" },
      });
    }
  }),
});

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

// Webhook endpoint removed - was dependent on apps system which has been removed
// New webhook system will be implemented based on node types and connections

/**
 * Health check endpoint for monitoring
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      // Basic health checks
      const startTime = Date.now();

      // Test database connectivity by running a simple query
      const dbCheck = await ctx.runQuery(
        internal.integrations.scenarios.queries.getScenarios,
        { limit: 1 },
      );

      const responseTime = Date.now() - startTime;

      // Get system stats
      const stats = {
        timestamp: Date.now(),
        uptime: process.uptime ? process.uptime() : "unknown",
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
  handler: httpAction(async (ctx, request) => {
    try {
      // Get system information
      const info = {
        version: "1.0.0",
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || "unknown",
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
        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          payload = await request.json();
        } else {
          const text = await request.text();
          if (text) {
            payload = { data: text };
          }
        }
      } catch (error) {
        payload = {};
      }

      // Trigger the scenario manually
      const result = await ctx.runAction(
        internal.integrations.webhooks.handler.triggerScenarioManually,
        {
          scenarioId: scenarioId as any, // Type assertion for ID
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
