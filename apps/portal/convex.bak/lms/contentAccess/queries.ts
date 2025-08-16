/**
 * Content Access Queries
 *
 * Read operations for content access control system.
 */
import { v } from "convex/values";

import { query } from "../../_generated/server";

// Get content access rules
export const getContentAccessRules = query({
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
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId),
      )
      .first();

    return rule ?? null;
  },
});

// Check content access for a user (with cascading logic)
export const checkContentAccess = query({
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
    parentContentType: v.optional(
      v.union(v.literal("course"), v.literal("lesson")),
    ),
    parentContentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get content-specific rules first
    const contentRules = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId),
      )
      .first();

    // If content has specific rules, use them
    if (contentRules) {
      // Check if rules are active
      if (contentRules.isActive === false) {
        return {
          hasAccess: true,
          accessRules: contentRules,
          reason: "Access rules are disabled",
        };
      }

      // If content is marked as public, allow access
      if (contentRules.isPublic) {
        return {
          hasAccess: true,
          accessRules: contentRules,
          reason: "Content is publicly accessible",
        };
      }

      // For now, return basic access control without complex tag checking
      return {
        hasAccess: true,
        accessRules: contentRules,
        reason: "Basic access granted",
      };
    }

    // If no content rules, check parent content rules (cascading access)
    if (args.parentContentType && args.parentContentId) {
      const parentRules = await ctx.db
        .query("contentAccessRules")
        .withIndex("by_content", (q) => {
          const contentType = args.parentContentType as "course" | "lesson";
          const contentId = args.parentContentId as string;
          return q.eq("contentType", contentType).eq("contentId", contentId);
        })
        .first();

      if (parentRules) {
        // Check if parent rules are active
        if (parentRules.isActive === false) {
          return {
            hasAccess: true,
            accessRules: parentRules,
            reason: "Parent access rules are disabled",
          };
        }

        // If parent is public, allow access
        if (parentRules.isPublic) {
          return {
            hasAccess: true,
            accessRules: parentRules,
            reason: "Parent content is publicly accessible",
          };
        }

        // For now, return basic access control
        return {
          hasAccess: true,
          accessRules: parentRules,
          reason: "Basic parent access granted",
        };
      }
    }

    // No rules found, default to allow access
    return {
      hasAccess: true,
      reason: "No access rules defined",
    };
  },
});
