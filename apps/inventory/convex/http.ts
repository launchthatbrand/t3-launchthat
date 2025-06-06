// Keep httpAction import from generated server

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// Correct import for httpRouter according to docs
import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

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

// Export the router as the default export
export default http;
