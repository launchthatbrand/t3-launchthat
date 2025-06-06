import { createClerkClient } from "@clerk/clerk-sdk-node";
import { v } from "convex/values";

import type { UserRole } from "./schema/types";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  action,
  internalMutation,
  mutation,
  MutationCtx,
} from "../_generated/server";
import {
  logError,
  throwForbidden,
  throwNotFound,
  throwUnauthorized,
} from "../shared/errors";
import { requireAdmin } from "./lib";

/**
 * Make the current authenticated user an admin
 * IMPORTANT: This is a convenience function for development
 * and should be removed in production
 */
export const makeCurrentUserAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throwUnauthorized("You must be logged in to perform this action");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throwNotFound("User", "with the current authentication token");
    }

    // Update the user's role to admin
    await ctx.db.patch(user._id, {
      role: "admin" as UserRole,
    });

    console.log(`User ${user._id} is now an admin`);
    return { success: true, userId: user._id };
  },
});

/**
 * Internal mutation to ensure a user record exists in Convex for the
 * currently authenticated Clerk user. Creates the user if they don't exist.
 * Assigns the 'admin' role if the user's email matches the
 * CONVEX_ADMIN_EMAIL environment variable.
 */
export const internalEnsureUser = internalMutation({
  args: {}, // No arguments needed, reads identity from context
  handler: async (ctx: MutationCtx) => {
    console.log("--- internalEnsureUser STARTED ---");
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      logError("No user identity found in internalEnsureUser", {
        identity: null,
      });
      return null;
    }
    console.log(
      `--- internalEnsureUser: Identity found for token ${identity.tokenIdentifier}, subject ${identity.subject} ---`,
    );

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (existingUser) {
      console.log(
        `--- internalEnsureUser: User ${identity.subject} already exists with ID ${existingUser._id}. Checking for updates... ---`,
      );

      // Check if name or image needs updating
      const newName = identity.name ?? identity.nickname ?? "Unnamed User";
      const newImage = identity.picture; // Assuming 'picture' is the claim for image URL in Clerk token

      const updates: Partial<{ name: string; image: string | undefined }> = {}; // image can be undefined if not present
      if (newName !== existingUser.name) {
        updates.name = newName;
      }
      // Only update image if newImage is provided and different, or if existing image exists and new one is null/undefined (to clear it)
      if (
        (newImage && newImage !== existingUser.image) ||
        (existingUser.image && !newImage)
      ) {
        updates.image = newImage; // This will set it to newImage (which could be string or undefined)
      }

      if (Object.keys(updates).length > 0) {
        try {
          await ctx.db.patch(existingUser._id, updates);
          console.log(
            `--- internalEnsureUser: Updated user ${existingUser._id} with new data:`,
            updates,
          );
        } catch (error) {
          logError(`Failed to update user ${existingUser._id}`, {
            error: String(error),
          });
          // Decide if you want to throw here or just log and continue
        }
      }
      return existingUser._id;
    }

    console.log(
      `--- internalEnsureUser: Creating new user for ${identity.subject}... ---`,
    );

    // Check environment variable for admin email
    // eslint-disable-next-line @typescript-eslint/no-restricted-imports, turbo/no-undeclared-env-vars
    const adminEmail = process.env.CONVEX_ADMIN_EMAIL;

    let userRole: UserRole = "user"; // Default role

    if (adminEmail && identity.email && identity.email === adminEmail) {
      console.log(
        `--- internalEnsureUser: Assigning admin role to user ${identity.email} ---`,
      );
      userRole = "admin";
    }

    // Extract relevant details from identity (adjust as needed)
    const userName = identity.name ?? identity.nickname ?? "Unnamed User";
    const userEmail = identity.email; // Assuming email is available and verified
    const userImage = identity.picture; // Assuming 'picture' is the claim for image URL

    if (!userEmail) {
      console.warn(
        `--- internalEnsureUser: User ${identity.subject} has no email address. Cannot assign role based on email. ---`,
      );
      userRole = "user";
    }

    // Insert the new user with determined role
    try {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        name: userName,
        email: userEmail ?? "", // Ensure email field matches schema (e.g., requires string)
        role: userRole,
        image: userImage, // Add image here
      });
      console.log(
        `--- internalEnsureUser: New user ${userId} created with role: ${userRole} ---`,
      );
      return userId;
    } catch (error) {
      logError("Failed to create user in internalEnsureUser", {
        identity: identity.tokenIdentifier,
        userName,
        error: String(error), // Convert error to string for logging
      });
      throw error; // Re-throw to make failure visible
    }
  },
});

/**
 * Public mutation wrapper that clients can call.
 * This simply triggers the internal logic to ensure the user exists.
 */
export const createOrGetUser = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"users"> | null> => {
    console.log("--- createOrGetUser (public wrapper) CALLED ---");
    // Call the internal mutation using the internal API reference
    const userId = await ctx.runMutation(internal.users.internalEnsureUser, {});
    console.log(
      "--- createOrGetUser (public wrapper) FINISHED, internalEnsureUser returned: ",
      userId,
    );
    return userId; // Return the result from the internal function
  },
});

/**
 * Update a user. Admin can update any user, regular user can only update self.
 */
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    data: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throwUnauthorized("You must be logged in to perform this action");
    }

    // Get the user making the request
    const userMakingRequest = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!userMakingRequest) {
      throwNotFound("User", "with the current authentication token");
    }

    // Check permissions
    const isAdmin = userMakingRequest.role === "admin";
    const isSelf = userMakingRequest._id === args.userId;

    // Only admins can update other users or change role
    if (!isAdmin && !isSelf) {
      throwForbidden("You don't have permission to update this user");
    }

    // Only admins can change role
    if (!isAdmin && args.data.role !== undefined) {
      throwForbidden("Only administrators can change user roles");
    }

    // Create update object
    const update: Record<string, unknown> = {};
    if (args.data.name !== undefined) update.name = args.data.name;
    if (args.data.email !== undefined) update.email = args.data.email;
    if (args.data.role !== undefined) update.role = args.data.role;

    // Update the user
    await ctx.db.patch(args.userId, update);

    // Return the updated user
    return await ctx.db.get(args.userId);
  },
});

/**
 * Delete a user from the system (admin only)
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is an admin
    await requireAdmin(ctx);

    // Get the user to delete
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throwNotFound("User", args.userId);
    }

    // Delete the user
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});

/**
 * Create or update a user based on Monday.com credentials
 */
export const ensureMondayUser = mutation({
  args: {
    email: v.string(),
    mondayUserId: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, mondayUserId, name, title, photoUrl } = args;

    console.log(
      `Ensuring Monday user exists for ${email} (ID: ${mondayUserId})`,
    );

    // First check if user already exists by Monday user ID
    let user = await ctx.db
      .query("users")
      .withIndex("by_monday_id", (q) => q.eq("mondayUserId", mondayUserId))
      .first();

    // If not found by Monday ID, try by email
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
    }

    // Check environment variable for admin email to grant admin privileges
    // eslint-disable-next-line @typescript-eslint/no-restricted-imports, turbo/no-undeclared-env-vars
    const adminEmail = process.env.CONVEX_ADMIN_EMAIL;
    const isAdmin = adminEmail && email === adminEmail;
    const role = isAdmin ? "admin" : "user";

    if (user) {
      // Update existing user with Monday credentials
      console.log(`Updating existing user ${user._id} with Monday credentials`);
      await ctx.db.patch(user._id, {
        email,
        name,
        mondayUserId,
        title: title ?? user.title,
        image: photoUrl ?? user.image,
        provider: "monday",
        role: isAdmin ? "admin" : user.role, // Only upgrade to admin, don't downgrade
      });
      return user._id;
    } else {
      // Create new user with Monday credentials
      console.log(`Creating new user for Monday user ${name} (${email})`);
      const userId = await ctx.db.insert("users", {
        email,
        name,
        mondayUserId,
        title,
        image: photoUrl,
        provider: "monday",
        role,
        tokenIdentifier: `monday:${mondayUserId}`, // Create a pseudo tokenIdentifier
      });
      console.log(`Created new user ${userId} for Monday user ${mondayUserId}`);
      return userId;
    }
  },
});

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
