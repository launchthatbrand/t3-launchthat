import {
  createMediaFromWebhook,
  uploadMediaOptions,
  uploadMediaPost,
} from "./core/media/http";

import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { httpRouter } from "convex/server";
import { api, components, internal } from "./_generated/api";
import { supportEmailInbound } from "./plugins/support/http";

const internalAny = internal as Record<string, any>;
const discordGuildConnectionsQuery = components.launchthat_discord.guildConnections
  .queries as any;
const discordGuildSettingsQuery = components.launchthat_discord.guildSettings
  .queries as any;
const discordSupportQueries = components.launchthat_discord.support.queries as any;

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

const buildPortalStripeCallbackUrl = (origin: string) => {
  const destination = new URL("/admin/edit", origin);
  destination.searchParams.set("plugin", "commerce");
  destination.searchParams.set("page", "settings");
  destination.searchParams.set("tab", "payments");
  destination.searchParams.set("gateway", "stripe");
  return destination;
};

const resolveVimeoClientId = () =>
   
  process.env.NEXT_PUBLIC_VIMEO_CLIENT_ID ??
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.VIMEO_CLIENT_ID ??
  "";

const VIMEO_SCOPE = "public private video_files";

const resolveStripeConnectClientId = () =>
   
  process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID ??
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.STRIPE_CONNECT_CLIENT_ID ??
  "";

// Stripe connect OAuth scopes:
// - read_write: needed for creating payments and managing connected account resources
const STRIPE_CONNECT_SCOPE = "read_write";

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

const startStripeOAuth = httpAction(async (_, request) => {
  const requestUrl = new URL(request.url);
  const clientId = resolveStripeConnectClientId();
  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "Stripe connect client id not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const baseOrigin = sanitizeOrigin(requestUrl.searchParams.get("origin"));
  const redirectUri = `${requestUrl.origin}/api/integrations/stripe`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: STRIPE_CONNECT_SCOPE,
    redirect_uri: redirectUri,
    state: baseOrigin,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://connect.stripe.com/oauth/authorize?${params.toString()}`,
    },
  });
});

const relayStripeOAuth = httpAction(async (_, request) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const state = requestUrl.searchParams.get("state");

  const baseOrigin = sanitizeOrigin(state);
  const destination = buildPortalStripeCallbackUrl(baseOrigin);

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

// Stripe webhooks (server-to-server; no CORS).
const stripeWebhook = httpAction(async (ctx, request) => {
  const signature = (request.headers.get("stripe-signature") ?? "").trim();
  const rawBody = await request.text();

  // Load Stripe secrets from site options (same keys used by Stripe settings page).
  const opt: any = await ctx.runQuery(api.core.options.get as any, {
    metaKey: "plugin.ecommerce.stripe.settings",
    type: "site",
    orgId: null,
  });
  const settings =
    opt && typeof opt === "object" && typeof opt.metaValue === "object" && opt.metaValue
      ? (opt.metaValue as any)
      : {};
  const secretKey =
    typeof settings.secretKey === "string" ? String(settings.secretKey).trim() : "";
  const webhookSecret =
    typeof settings.webhookSecret === "string" ? String(settings.webhookSecret).trim() : "";

  if (!secretKey || !webhookSecret) {
    return new Response("Stripe not configured", { status: 500 });
  }
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  try {
    const res: any = await ctx.runAction(
      (components as any).launchthat_ecommerce.payouts.actions.processStripeWebhook,
      {
        stripeSecretKey: secretKey,
        stripeWebhookSecret: webhookSecret,
        signature,
        rawBody,
      },
    );

    // Always 2xx for handled/ignored events to stop retries.
    return new Response(JSON.stringify({ ok: true, handled: Boolean(res?.handled) }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    // Stripe expects 2xx for events we "accept", but for signature verification failures we want a 4xx
    // so Stripe retries until configuration is fixed.
    const message = String(err?.message ?? err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
});

http.route({
  path: "/healthz",
  method: "GET",
  handler: httpAction(async () => new Response("ok")),
});

http.route({
  path: "/discord/gateway",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.DISCORD_RELAY_SECRET ?? "";
    if (!secret) {
      return new Response("Missing DISCORD_RELAY_SECRET env", { status: 500 });
    }

    const sigB64 = (request.headers.get("x-relay-signature") ?? "").trim();
    if (!sigB64) return new Response("Missing signature", { status: 401 });

    const bodyText = await request.text();

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(bodyText),
    );

    const macBytes = new Uint8Array(mac);
    const expectedB64 = btoa(String.fromCharCode(...macBytes));
    // Constant-time-ish compare (same length enforced)
    if (expectedB64.length !== sigB64.length) {
      return new Response("Invalid signature", { status: 401 });
    }
    let mismatch = 0;
    for (let i = 0; i < expectedB64.length; i++) {
      mismatch |= expectedB64.charCodeAt(i) ^ sigB64.charCodeAt(i);
    }
    if (mismatch !== 0) {
      return new Response("Invalid signature", { status: 401 });
    }

    let event: unknown;
    try {
      event = JSON.parse(bodyText);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Let the worker know whether it should show typing indicators for this event.
    // This is a best-effort hint; the real source of truth is `processGatewayEvent`.
    let shouldType = false;
    try {
      const guildId =
        event && typeof event === "object" && typeof (event as any).guildId === "string"
          ? String((event as any).guildId)
          : "";
      if (guildId) {
        const guildConn = await ctx.runQuery(
          (discordGuildConnectionsQuery as any).getGuildConnectionByGuildId,
          { guildId },
        );
        const organizationId = String(guildConn?.organizationId ?? "");
        if (organizationId) {
          const settings = await ctx.runQuery(
            (discordGuildSettingsQuery as any).getGuildSettings,
            { organizationId, guildId },
          );
          const supportAiEnabled = Boolean(settings?.supportAiEnabled);
          const forumChannelId =
            typeof settings?.supportForumChannelId === "string"
              ? settings.supportForumChannelId
              : null;
          const privateIntakeChannelId =
            typeof (settings as any)?.supportPrivateIntakeChannelId === "string"
              ? String((settings as any).supportPrivateIntakeChannelId)
              : null;
          const escalationKeywords: string[] = Array.isArray(
            (settings as any)?.escalationKeywords,
          )
            ? ((settings as any).escalationKeywords as unknown[])
                .filter((v) => typeof v === "string")
                .map((v) => String(v).trim().toLowerCase())
                .filter(Boolean)
                .slice(0, 50)
            : [];
          const isMessageCreate = (event as any).type === "message_create";
          const authorIsBot = Boolean((event as any).authorIsBot);
          const threadId =
            typeof (event as any).threadId === "string"
              ? String((event as any).threadId)
              : "";
          const incomingParentId =
            typeof (event as any).forumChannelId === "string"
              ? String((event as any).forumChannelId)
              : null;

          if (!supportAiEnabled || authorIsBot || !isMessageCreate) {
            shouldType = false;
          } else if (incomingParentId && forumChannelId && incomingParentId === forumChannelId) {
            const content =
              typeof (event as any).content === "string"
                ? String((event as any).content)
                : "";
            const contentLower = content.toLowerCase();
            const keywordHit =
              escalationKeywords.length > 0
                ? escalationKeywords.some((kw) => kw && contentLower.includes(kw))
                : false;

            // If this will trigger a private handoff, don't show typing in the public thread.
            if (keywordHit && privateIntakeChannelId) {
              shouldType = false;
            } else if (threadId) {
              const mapping = await ctx.runQuery(
                (discordSupportQueries as any).getEscalationMappingForThread,
                { guildId, threadId },
              );
              shouldType = !(mapping && mapping.publicThreadId === threadId);
            } else {
              shouldType = true;
            }
          } else if (
            incomingParentId &&
            privateIntakeChannelId &&
            incomingParentId === privateIntakeChannelId &&
            threadId
          ) {
            const mapping = await ctx.runQuery(
              (discordSupportQueries as any).getEscalationMappingForThread,
              { guildId, threadId },
            );
            shouldType = Boolean(mapping && mapping.privateThreadId === threadId);
          } else {
            shouldType = false;
          }
        }
      }
    } catch {
      shouldType = false;
    }

    await ctx.scheduler.runAfter(
      0,
      internalAny.plugins.discord.gateway.processGatewayEvent,
      { event, receivedAt: Date.now() },
    );

    return new Response(JSON.stringify({ ok: true, shouldType }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
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

http.route({
  path: "/api/integrations/stripe",
  method: "GET",
  handler: relayStripeOAuth,
});

http.route({
  path: "/api/integrations/stripe/start",
  method: "GET",
  handler: startStripeOAuth,
});

http.route({
  path: "/api/webhooks/stripe",
  method: "POST",
  handler: stripeWebhook,
});

// Vimeo webhooks: best-effort receiver (Vimeo does not send CORS requests)
http.route({
  path: "/api/vimeo/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const connectionId = url.searchParams.get("connectionId");
    const secret = url.searchParams.get("secret");

    if (!connectionId || !secret) {
      return new Response(JSON.stringify({ error: "Missing connectionId/secret" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let payload: unknown = null;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }

    const headerEvent =
      request.headers.get("x-vimeo-event") ??
      request.headers.get("x-vimeo-webhook-event") ??
      request.headers.get("x-event-type");
    const bodyEvent =
      payload && typeof payload === "object"
        ? ((payload as any).event ??
            (payload as any).type ??
            (payload as any).event_type ??
            (payload as any).name)
        : undefined;
    const eventType = String(headerEvent ?? bodyEvent ?? "unknown");

    await ctx.scheduler.runAfter(0, internalAny.plugins.vimeo.actions.processWebhookRequest, {
      connectionId: connectionId as Id<"connections">,
      secret,
      headerEvent: eventType,
      payload,
      receivedAt: Date.now(),
    });

    // Vimeo expects a quick 2xx.
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
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
