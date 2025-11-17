import { v } from "convex/values";

import { query } from "../_generated/server";
import { throwForbidden } from "../shared/errors";
import { requireAdmin } from "./helpers";

/**
 * Get the system user for automated operations
 * This is useful for scenarios, integrations, and other system processes
 */
export const getSystemUser = query({
  args: {},
  handler: async (ctx) => {
    // First try to find an existing system user
    const systemUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "system@example.com"))
      .first();

    if (systemUser) {
      return systemUser;
    }

    // If no system user exists, find any admin user
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (adminUser) {
      return adminUser;
    }

    // If no admin user exists, return any user (last resort)
    const anyUser = await ctx.db.query("users").first();

    return anyUser;
  },
});

/**
 * Get a user by their Clerk ID
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.string(),
      role: v.optional(v.string()), // Changed to accept any string role
      tokenIdentifier: v.optional(v.string()),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
      addresses: v.optional(
        v.array(
          v.object({
            fullName: v.string(),
            addressLine1: v.string(),
            addressLine2: v.optional(v.string()),
            city: v.string(),
            stateOrProvince: v.string(),
            postalCode: v.string(),
            country: v.string(),
            phoneNumber: v.optional(v.string()),
          }),
        ),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Get the user based on their Clerk ID (subject)
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq(
          "tokenIdentifier",
          `https://topical-raccoon-68.clerk.accounts.dev|${args.clerkId}`,
        ),
      )
      .unique();

    if (!user) {
      return null;
    }

    return user;
  },
});

/**
 * List all users in the system
 */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    // Check if the user has permissions to list all users
    try {
      await requireAdmin(ctx);
    } catch {
      // If not an admin, throw a proper forbidden error
      throwForbidden("Only administrators can view all users");
    }

    // Get all users
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

/**
 * Get the currently authenticated user
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    return user;
  },
});

/**
 * Get a user by email address
 */
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.string(),
      role: v.optional(v.string()),
      tokenIdentifier: v.optional(v.string()),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
      addresses: v.optional(
        v.array(
          v.object({
            addressLine1: v.string(),
            addressLine2: v.optional(v.string()),
            city: v.string(),
            country: v.string(),
            fullName: v.string(),
            phoneNumber: v.optional(v.string()),
            postalCode: v.string(),
            stateOrProvince: v.string(),
          }),
        ),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      // Find user by email
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      return user;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return null;
    }
  },
});

/**
 * Get a user by ID
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.string(),
      role: v.optional(v.string()), // Changed to accept any string role
      tokenIdentifier: v.optional(v.string()),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      // Check if user is an admin
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }
      const userMakingRequest = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();

      if (!userMakingRequest) {
        return null; // User making request not found
      }

      // Admins can get any user, others can only get themselves
      if (
        userMakingRequest.role === "admin" ||
        userMakingRequest._id === args.userId
      ) {
        const user = await ctx.db.get(args.userId);
        return user;
      }
      return null; // Not authorized
    } catch (error) {
      console.error("Error in getUserById:", error);
      return null; // Or throw error based on desired behavior
    }
  },
});
