"use node";

import { createClerkClient } from "@clerk/backend";
import { v } from "convex/values";

import { action } from "./_generated/server";

export const createOrGetClerkUserFromMonday = action({
  args: {
    mondayUser: v.object({
      id: v.string(), // Monday User ID
      email: v.string(),
      name: v.optional(v.string()),
    }),
  },
  returns: v.object({
    userId: v.string(), // Clerk User ID
    sessionToken: v.string(),
    isNewUser: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const { mondayUser } = args;

    // Check for clerk secret key inside the handler to avoid direct process.env access at the module level
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new Error("CLERK_SECRET_KEY environment variable is not set");
    }

    // Initialize Clerk client inside the handler
    const clerkClient = createClerkClient({ secretKey });

    try {
      // Check if user already exists in Clerk by their Monday email
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [mondayUser.email],
      });

      let clerkUserId: string;
      let isNewUser = false;

      if (existingUsers.data.length > 0 && existingUsers.data[0]) {
        // User exists
        clerkUserId = existingUsers.data[0].id;
        console.log(
          `Found existing Clerk user: ${clerkUserId} for Monday user ${mondayUser.email}`,
        );

        // Optionally: Update Clerk user with latest Monday info (name, metadata etc.)
        // const clerkUser = existingUsers.data[0];
        // let metadataUpdate = {};
        // if (clerkUser.firstName !== mondayUser.name?.split(" ")[0] ||
        //     clerkUser.publicMetadata.mondayUserId !== mondayUser.id) {
        //   metadataUpdate = {
        //     firstName: mondayUser.name?.split(" ")[0],
        //     lastName: mondayUser.name?.split(" ").slice(1).join(" "),
        //     publicMetadata: { ...clerkUser.publicMetadata, mondayUserId: mondayUser.id },
        //   }
        //   await clerkClient.users.updateUser(clerkUserId, metadataUpdate);
        // }
      } else {
        // User does not exist, create them
        console.log(
          `Creating new Clerk user for Monday user ${mondayUser.email}`,
        );

        // Generate a strong random password since Clerk requires one
        const generateRandomPassword = () => {
          const length = 16;
          const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
          let password = "";
          for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
          }
          return password;
        };

        const randomPassword = generateRandomPassword();

        // Create user with the required parameters for Clerk v1.34.0
        const newUserParams = {
          emailAddress: [mondayUser.email],
          password: randomPassword, // Required field for Clerk user creation
          firstName: mondayUser.name?.split(" ")[0] || "Monday",
          lastName: mondayUser.name?.split(" ").slice(1).join(" ") || "User",
          publicMetadata: {
            mondayUserId: mondayUser.id,
            source: "monday.com",
            createdAt: new Date().toISOString(),
          },
          // Use skipPasswordChecks instead of skipPasswordRequirement, if available
          // or remove it if the API doesn't support it
          skipPasswordChecks: true,
        };

        try {
          const newUser = await clerkClient.users.createUser(newUserParams);
          clerkUserId = newUser.id;
          isNewUser = true;
          console.log(`Created new Clerk user: ${clerkUserId}`);
        } catch (createError) {
          console.error(
            "Error creating user with skipPasswordChecks:",
            createError,
          );

          // If first attempt fails, try without skipPasswordChecks
          const retryParams = { ...newUserParams };
          delete retryParams.skipPasswordChecks;

          console.log("Retrying user creation without skipPasswordChecks");
          const newUser = await clerkClient.users.createUser(retryParams);
          clerkUserId = newUser.id;
          isNewUser = true;
          console.log(`Created new Clerk user on retry: ${clerkUserId}`);
        }
      }

      // For Clerk v1.34.0, use signInTokens with required expiresInSeconds
      const signInToken = await clerkClient.signInTokens.createSignInToken({
        userId: clerkUserId,
        // Set token expiration (required parameter)
        expiresInSeconds: 60 * 60 * 24, // 24 hours
      });

      if (!signInToken.token) {
        throw new Error("Failed to create a valid sign-in token");
      }

      console.log(`Created sign-in token for Clerk user: ${clerkUserId}`);

      // Return the token as the sessionToken (frontend will use this with Clerk)
      return {
        userId: clerkUserId,
        sessionToken: signInToken.token,
        isNewUser,
      };
    } catch (error: unknown) {
      console.error(
        "Error in createOrGetClerkUserFromMonday:",
        error instanceof Error ? error.message : JSON.stringify(error, null, 2),
      );

      let message = "Unknown error";

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "errors" in error &&
        Array.isArray((error as { errors: { message?: string }[] }).errors) &&
        (error as { errors: { message?: string }[] }).errors[0]?.message
      ) {
        // Standard Clerk error structure
        message = (error as { errors: { message: string }[] }).errors[0]
          .message;
      }

      throw new Error(`Failed to create or get Clerk user: ${message}`);
    }
  },
});
