import { Auth } from "convex/server";
import { v } from "convex/values";

// This allows us to test with a mock identity provider
export default {
  providers: [
    {
      domain: "https://topical-raccoon-68.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
  // For development, allow unauthenticated requests
  allowUnauthenticatedRequests: true,
};
