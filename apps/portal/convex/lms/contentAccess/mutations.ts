/**
 * Content Access Mutations
 *
 * Write operations for content access control system.
 */
import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

// Save content access rules
export const saveContentAccessRules = mutation({
  args: {
    contentType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("topic"),
      v.literal("download"),
      v.literal("product"),
      v.literal("quiz"),
    ),
    contentId: v.string(),
    isPublic: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    priority: v.optional(v.number()),
    requiredTags: v.any(), // Use any to avoid complex type validation
    excludedTags: v.any(), // Use any to avoid complex type validation
  },
  returns: v.string(), // Returns the rule ID
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const now = Date.now();

    // Check if rules already exist for this content
    const existingRule = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId),
      )
      .first();

    if (existingRule) {
      // Update existing rule
      await ctx.db.patch(existingRule._id, {
        isPublic: args.isPublic,
        isActive: args.isActive ?? true,
        priority: args.priority ?? 1,
        requiredTags: args.requiredTags as any,
        excludedTags: args.excludedTags as any,
        updatedAt: now,
      });
      return existingRule._id;
    } else {
      // Create new rule
      const ruleId = await ctx.db.insert("contentAccessRules", {
        contentType: args.contentType,
        contentId: args.contentId,
        isPublic: args.isPublic,
        isActive: args.isActive ?? true,
        priority: args.priority ?? 1,
        requiredTags: args.requiredTags as any,
        excludedTags: args.excludedTags as any,
        createdAt: now,
        updatedAt: now,
        createdBy: user._id,
      });
      return ruleId;
    }
  },
});

// Clear content access rules
export const clearContentAccessRules = mutation({
  args: {
    contentType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("topic"),
      v.literal("download"),
      v.literal("product"),
      v.literal("quiz"),
    ),
    contentId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existingRule = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId),
      )
      .first();

    if (existingRule) {
      await ctx.db.delete(existingRule._id);
      return true;
    }
    return false;
  },
});

// Log content access attempt for auditing
export const logContentAccess = mutation({
  args: {
    userId: v.id("users"),
    contentType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("topic"),
      v.literal("download"),
      v.literal("product"),
      v.literal("quiz"),
    ),
    contentId: v.string(),
    accessGranted: v.boolean(),
    reason: v.optional(v.string()),
  },
  returns: v.any(), // Use any for return type
  handler: async (ctx, args) => {
    // Simplified version without complex userMarketingTags logic
    return await ctx.db.insert("contentAccessLog", {
      userId: args.userId,
      contentType: args.contentType,
      contentId: args.contentId,
      accessGranted: args.accessGranted,
      reason: args.reason,
      accessedAt: Date.now(),
      userTags: [], // Empty array for now
    });
  },
});

// Delete content access rules
export const deleteContentAccessRules = mutation({
  args: {
    contentType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("topic"),
      v.literal("download"),
      v.literal("product"),
      v.literal("quiz"),
    ),
    contentId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      throw new ConvexError(
        "Permission denied: Only admins can manage content access rules",
      );
    }

    // Find and delete the rule
    const rule = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId),
      )
      .first();

    if (rule) {
      await ctx.db.delete(rule._id);
      return true;
    }

    return false;
  },
});
