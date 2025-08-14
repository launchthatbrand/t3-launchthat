/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Content Access Queries
 *
 * Read operations for content access control system.
 */
import { v } from "convex/values";

import { query } from "../../_generated/server";

type ContentType =
  | "course"
  | "lesson"
  | "topic"
  | "download"
  | "product"
  | "quiz";

// Get content access rules
export const getContentAccessRules = query({
  args: {
    // Use string to avoid deep type instantiation issues in TS
    contentType: v.string(),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q
          .eq("contentType", args.contentType as ContentType)
          .eq("contentId", args.contentId),
      )
      .first();

    return rule ?? null;
  },
});

// Check content access for a user (with cascading logic)
export const checkContentAccess = query({
  args: {
    userId: v.id("users"),
    contentType: v.string(),
    contentId: v.string(),
    parentContentType: v.optional(v.string()),
    parentContentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get content-specific rules first
    const contentRules = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q
          .eq("contentType", args.contentType as ContentType)
          .eq("contentId", args.contentId),
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
          const contentType = args.parentContentType! as ContentType;
          const contentId = args.parentContentId!;
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
