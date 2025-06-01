import { httpRouter } from "convex/server";

import { httpAction } from "./_generated/server";

// Creates common CORS headers for HTTP responses
const createCorsHeaders = () => ({
  // In Convex functions, we need to use process.env directly
  // as the environment utilities are for the Next.js environment
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

// Create an HTTP router
const http = httpRouter();

// Define routes for email parsing related endpoints (to be implemented later)
// Example: handling webhooks from email providers

// Handle OPTIONS preflight requests for CORS
http.route({
  path: "/api",
  method: "OPTIONS",
  // eslint-disable-next-line @typescript-eslint/require-await -- Required by httpAction type
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: createCorsHeaders(),
    });
  }),
});

// Export the router as the default export
export default http;
