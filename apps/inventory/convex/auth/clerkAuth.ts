"use node";

import { clerkClient } from "@clerk/clerk-sdk-node";
import { v } from "convex/values";

import { action } from "../_generated/server";

/**
 * Create or login a Clerk user with Monday.com credentials
 * and return user information for client-side authentication
 *
 * @param email The email address from Monday.com
 * @param mondayUserId The Monday.com user ID
 * @param name The user's name from Monday.com
 * @returns User information for client-side authentication
 */
export const createOrLoginWithMonday = action({
  args: {
    email: v.string(),
    mondayUserId: v.string(),
    name: v.string(),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, mondayUserId, name } = args;
    // Note: photoUrl is intentionally not destructured as it's passed through to the client
    // but not used directly in this function

    try {
      // Check for Clerk API key
      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error("CLERK_SECRET_KEY is not set");
      }

      console.log(`Authenticating Monday user with Clerk: ${email}`);

      // Step 1: Try to find existing user by email
      let user;
      try {
        const users = await clerkClient.users.getUserList({
          emailAddress: [email],
        });

        // getUserList returns a paginated response, we need to access the data property
        user = users.data.length ? users.data[0] : null;

        if (user) {
          console.log(`Found existing Clerk user for ${email}`);
        }
      } catch (error) {
        console.error("Error finding Clerk user:", error);
        throw new Error(
          `Error finding user: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Step 2: Create user if not found
      if (!user) {
        console.log(`Creating new Clerk user for ${email}`);
        try {
          // Generate a secure random password for the user
          const securePassword =
            Math.random().toString(36).slice(-10) +
            Math.random().toString(36).toUpperCase().slice(-2) +
            Math.random().toString(36).slice(-2) +
            "!#$";

          user = await clerkClient.users.createUser({
            emailAddress: [email],
            firstName: name.split(" ")[0],
            lastName: name.split(" ").slice(1).join(" ") || " ", // Ensure last name is not empty
            externalId: mondayUserId,
            password: securePassword, // Required field
            publicMetadata: {
              mondayUserId,
              provider: "monday",
            },
          });
        } catch (createError) {
          console.error("Error creating Clerk user:", createError);
          throw new Error(
            `Error creating user: ${createError instanceof Error ? createError.message : String(createError)}`,
          );
        }
      }

      if (!user) {
        throw new Error("Failed to create or find user");
      }

      // Return the user info for client-side auth
      return {
        success: true,
        email: email,
        userId: user.id,
        publicMetadata: user.publicMetadata,
      };
    } catch (error) {
      console.error("Monday-Clerk authentication failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
