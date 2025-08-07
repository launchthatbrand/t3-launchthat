import { v } from "convex/values";

import type { UserRole } from "./schema/types";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { internalMutation, mutation, MutationCtx } from "../_generated/server";
import {
  logError,
  throwForbidden,
  throwNotFound,
  throwUnauthorized,
} from "../shared/errors";
import { requireAdmin } from "./helpers";

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
      role: v.optional(v.string()), // Changed to accept any string role
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
 * Create a system user if one doesn't already exist
 * This is useful for scenarios, integrations, and other system processes
 */
export const createSystemUserIfNeeded = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if a system user already exists
    const existingSystemUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "system@example.com"))
      .first();

    // If a system user already exists, return it
    if (existingSystemUser) {
      return existingSystemUser._id;
    }

    // Otherwise, create a new system user
    const now = Date.now();
    const systemUserId = await ctx.db.insert("users", {
      name: "System",
      email: "system@example.com",
      role: "admin",
      username: "system",
      tokenIdentifier: "",
    });

    return systemUserId;
  },
});
