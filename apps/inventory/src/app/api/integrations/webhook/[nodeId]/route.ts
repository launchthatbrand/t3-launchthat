/**
 * Webhook receiver API route for integration scenarios
 *
 * This API route receives webhook payloads from external services,
 * validates them, and forwards them to the Convex backend for processing.
 */
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// Create a Convex client for server-side API calls
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

/**
 * Handler for incoming webhook requests
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  return await handleWebhook(req, params, "POST");
}

/**
 * Handler for GET webhook requests (used by some services for verification)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  return await handleWebhook(req, params, "GET");
}

/**
 * Handler for PUT webhook requests
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  return await handleWebhook(req, params, "PUT");
}

/**
 * Handler for PATCH webhook requests
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  return await handleWebhook(req, params, "PATCH");
}

/**
 * Handler for DELETE webhook requests
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  return await handleWebhook(req, params, "DELETE");
}

/**
 * Common handler for webhook requests
 */
async function handleWebhook(
  req: NextRequest,
  params: { nodeId: string },
  method: string,
) {
  try {
    // Check if Convex is properly configured
    if (!convex) {
      console.error(
        "Convex client not initialized - missing environment variable",
      );
      return NextResponse.json(
        { error: "Integration service unavailable" },
        { status: 503 },
      );
    }

    // Get the token from the query string
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing webhook token" },
        { status: 401 },
      );
    }

    // Parse the request body
    let body = null;
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        body = await req.json();
      } else {
        body = await req.text();
      }
    } catch (error) {
      console.error("Error parsing webhook body:", error);
      // Continue with null body if we can't parse it
    }

    // Convert headers to a simple object
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Process the webhook using Convex
    const result = await convex.mutation(
      api.integrations.scenarios.triggers.processWebhook,
      {
        nodeId: params.nodeId,
        token,
        headers,
        body,
        method,
        timestamp: Date.now(),
      },
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Unknown error" },
        { status: 400 },
      );
    }

    // Return success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * Set CORS headers for the webhook endpoint
 */
export async function OPTIONS() {
  return NextResponse.json(
    { success: true },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
