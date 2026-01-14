import { v } from "convex/values";

import { query } from "../../_generated/server";
import type { Doc } from "../../_generated/dataModel";
import { throwForbidden } from "../../shared/errors";

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
    const project = (user: Doc<"users"> | null) => {
      if (!user) return null;
      return {
        _id: user._id,
        _creationTime: user._creationTime,
        name: user.name ?? undefined,
        email: user.email,
        role: user.role ?? undefined,
        tokenIdentifier: user.tokenIdentifier ?? undefined,
        username: user.username ?? undefined,
        image: user.image ?? undefined,
        addresses: user.addresses ?? undefined,
      };
    };

    // Prefer the authenticated Convex identity (works in all environments).
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.tokenIdentifier) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      return project(user);
    }

    // Fallback: resolve by stored Clerk user id (subject).
    // Note: this keeps backwards compatibility for code paths that only have a Clerk id.
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return project(user ?? null);
  },
});

/**
 * List all users in the system
 */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throwForbidden("Only administrators can view all users");
    }
    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!me || me.role !== "admin") {
      throwForbidden("Only administrators can view all users");
    }

    // Get all users (hide deleted users by default)
    const users = await ctx.db.query("users").collect();
    return users.filter((u) => u.status !== "deleted");
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

    // Prefer lookup by tokenIdentifier, but fall back to Clerk subject (clerk user id).
    // This supports non-Clerk issuers (e.g. server-minted Convex tokens) where
    // tokenIdentifier will not match our stored Clerk tokenIdentifier.
    let user =
      (await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique()) ?? null;

    if (!user && typeof identity.subject === "string" && identity.subject.trim()) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
    }

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
      const project = (user: Doc<"users"> | null) => {
        if (!user) return null;
        return {
          _id: user._id,
          _creationTime: user._creationTime,
          name: user.name ?? undefined,
          email: user.email,
          role: user.role ?? undefined,
          tokenIdentifier: user.tokenIdentifier ?? undefined,
          username: user.username ?? undefined,
          image: user.image ?? undefined,
          addresses: user.addresses ?? undefined,
        };
      };

      // Find user by email
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      return project(user ?? null);
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return null;
    }
  },
});

/**
 * Get a user by username (for public profile/journal routes).
 */
export const getUserByUsername = query({
  args: {
    username: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.string(),
      role: v.optional(v.string()),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
      organizationId: v.optional(v.id("organizations")),
    }),
  ),
  handler: async (ctx, args) => {
    const username = args.username.trim();
    if (!username) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (!user) return null;
    if (args.organizationId && user.organizationId !== args.organizationId) {
      return null;
    }

    return {
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name ?? undefined,
      email: user.email,
      role: user.role ?? undefined,
      username: user.username ?? undefined,
      image: user.image ?? undefined,
      organizationId: user.organizationId ?? undefined,
    };
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
      status: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const project = (user: Doc<"users"> | null) => {
        if (!user) return null;
        return {
          _id: user._id,
          _creationTime: user._creationTime,
          name: user.name ?? undefined,
          email: user.email,
          role: user.role ?? undefined,
          tokenIdentifier: user.tokenIdentifier ?? undefined,
          username: user.username ?? undefined,
          image: user.image ?? undefined,
          status: user.status ?? undefined,
        };
      };

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
        return project(user ?? null);
      }
      return null; // Not authorized
    } catch (error) {
      console.error("Error in getUserById:", error);
      return null; // Or throw error based on desired behavior
    }
  },
});
