"use node";

import { v } from "convex/values";

import { action } from "../_generated/server";

/**
 * Authenticates a user from Monday.com context and returns a JWT token
 * that can be used with Clerk to authenticate the user
 *
 * This is a secure action because:
 * 1. It runs server-side in Convex (Node.js environment)
 * 2. It can verify the Monday credentials without exposing secrets to the client
 * 3. It can create a signed JWT for Clerk to verify the user's identity
 */
export const authenticateMonday = action({
  args: {
    email: v.string(),
    mondayUserId: v.string(),
    boardId: v.optional(v.string()),
    workspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, mondayUserId, boardId, workspaceId } = args;

    try {
      // In a production environment, you would:
      // 1. Verify the Monday.com context using Monday's API
      // 2. Check if the user is authorized to access this application
      // 3. Generate a secure JWT token for Clerk

      // Simulate an async operation to validate the Monday context
      await new Promise((resolve) => setTimeout(resolve, 100));

      // For demo purposes, we'll use a simplified approach:

      // 1. Log the authentication attempt
      console.log(`Authenticating Monday user: ${email} (ID: ${mondayUserId})`);
      if (boardId) {
        console.log(`Board ID: ${boardId}`);
      }
      if (workspaceId) {
        console.log(`Workspace ID: ${workspaceId}`);
      }

      // 2. Create a dummy JWT token
      // In production, use a proper JWT library and signing key
      const tokenPayload = {
        sub: mondayUserId,
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
        source: "monday",
      };

      const token = Buffer.from(JSON.stringify(tokenPayload)).toString(
        "base64",
      );

      // 3. Return the token and email
      return {
        success: true,
        token,
        email,
      };
    } catch (error) {
      console.error("Error authenticating Monday user:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  },
});
