import { query } from "../../_generated/server";
import { v } from "convex/values";

const contentTypeValidator = v.union(
  v.literal("course"),
  v.literal("lesson"),
  v.literal("topic"),
  v.literal("download"),
  v.literal("product"),
  v.literal("quiz"),
);

export const getContentAccessRules = query({
  args: {
    contentType: contentTypeValidator,
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    return (
      (await ctx.db
        .query("contentAccessRules")
        .withIndex("by_content", (q) =>
          q.eq("contentType", args.contentType).eq("contentId", args.contentId),
        )
        .first()) ?? null
    );
  },
});

export const checkContentAccess = query({
  args: {
    userId: v.id("users"),
    contentType: contentTypeValidator,
    contentId: v.string(),
    parentContentType: v.optional(
      v.union(v.literal("course"), v.literal("lesson")),
    ),
    parentContentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const directRule = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId),
      )
      .first();

    if (directRule) {
      if (directRule.isActive === false) {
        return {
          hasAccess: true,
          accessRules: directRule,
          reason: "Access rules are disabled",
        };
      }

      if (directRule.isPublic) {
        return {
          hasAccess: true,
          accessRules: directRule,
          reason: "Content is publicly accessible",
        };
      }

      return {
        hasAccess: true,
        accessRules: directRule,
        reason: "Direct rule allowed access",
      };
    }

    if (args.parentContentType && args.parentContentId) {
      const parentRule = await ctx.db
        .query("contentAccessRules")
        .withIndex("by_content", (q) =>
          q
            .eq("contentType", args.parentContentType as "course" | "lesson")
            .eq("contentId", args.parentContentId as string),
        )
        .first();

      if (parentRule) {
        if (parentRule.isActive === false) {
          return {
            hasAccess: true,
            accessRules: parentRule,
            reason: "Parent access rules are disabled",
          };
        }

        if (parentRule.isPublic) {
          return {
            hasAccess: true,
            accessRules: parentRule,
            reason: "Parent content is publicly accessible",
          };
        }

        return {
          hasAccess: true,
          accessRules: parentRule,
          reason: "Parent rule allowed access",
        };
      }
    }

    return {
      hasAccess: true,
      reason: "No access rules defined",
    };
  },
});
