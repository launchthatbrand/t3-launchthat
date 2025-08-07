import { ConvexError, v } from "convex/values";
import { mutation, query } from "../../_generated/server";

import { Id } from "../../_generated/dataModel";

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
    requiredTags: v.object({
      mode: v.union(v.literal("all"), v.literal("some")),
      tagIds: v.array(v.id("marketingTags")),
    }),
    excludedTags: v.object({
      mode: v.union(v.literal("all"), v.literal("some")),
      tagIds: v.array(v.id("marketingTags")),
    }),
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
        requiredTags: args.requiredTags,
        excludedTags: args.excludedTags,
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
        requiredTags: args.requiredTags,
        excludedTags: args.excludedTags,
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
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("contentAccessRules"),
      _creationTime: v.number(), // Add the missing _creationTime field
      contentId: v.string(),
      contentType: v.union(
        v.literal("course"),
        v.literal("lesson"),
        v.literal("topic"),
        v.literal("download"),
        v.literal("product"),
        v.literal("quiz"),
      ),
      isPublic: v.optional(v.boolean()),
      isActive: v.optional(v.boolean()),
      priority: v.optional(v.float64()),
      requiredTags: v.object({
        mode: v.union(v.literal("all"), v.literal("some")),
        tagIds: v.array(v.id("marketingTags")),
      }),
      excludedTags: v.object({
        mode: v.union(v.literal("all"), v.literal("some")),
        tagIds: v.array(v.id("marketingTags")),
      }),
      createdAt: v.optional(v.float64()),
      createdBy: v.optional(v.id("users")),
      updatedAt: v.optional(v.float64()),
    }),
  ),
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
  returns: v.object({
    hasAccess: v.boolean(),
    accessRules: v.optional(v.any()),
    reason: v.optional(v.string()),
  }),
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

      // Check access based on content's rules
      const userTags = await ctx.db
        .query("userMarketingTags")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      const userTagIds = userTags.map((tag) => tag.marketingTagId);

      return {
        hasAccess: checkTagsAccess(contentRules, userTagIds),
        accessRules: contentRules,
        reason: checkTagsAccess(contentRules, userTagIds)
          ? "User has required tags"
          : "User does not meet tag requirements",
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

        // Check access based on parent's rules
        const userTags = await ctx.db
          .query("userMarketingTags")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        const userTagIds = userTags.map((tag) => tag.marketingTagId);

        return {
          hasAccess: checkTagsAccess(parentRules, userTagIds),
          accessRules: parentRules,
          reason: checkTagsAccess(parentRules, userTagIds)
            ? "User has required tags for parent content"
            : "User does not meet parent content tag requirements",
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

// Helper function to check tag-based access
function checkTagsAccess(
  rules: {
    requiredTags: { mode: "all" | "some"; tagIds: Id<"marketingTags">[] };
    excludedTags: { mode: "all" | "some"; tagIds: Id<"marketingTags">[] };
  },
  userTagIds: Id<"marketingTags">[],
): boolean {
  // Check excluded tags first
  if (rules.excludedTags.tagIds.length > 0) {
    const hasExcludedTags = rules.excludedTags.tagIds.some((tagId) =>
      userTagIds.includes(tagId),
    );
    if (rules.excludedTags.mode === "some" && hasExcludedTags) {
      return false; // User has at least one excluded tag
    }
    if (rules.excludedTags.mode === "all") {
      const hasAllExcludedTags = rules.excludedTags.tagIds.every((tagId) =>
        userTagIds.includes(tagId),
      );
      if (hasAllExcludedTags) {
        return false; // User has all excluded tags
      }
    }
  }

  // Check required tags
  if (rules.requiredTags.tagIds.length > 0) {
    if (rules.requiredTags.mode === "all") {
      return rules.requiredTags.tagIds.every((tagId) =>
        userTagIds.includes(tagId),
      );
    } else {
      return rules.requiredTags.tagIds.some((tagId) =>
        userTagIds.includes(tagId),
      );
    }
  }

  // No required tags, allow access (excluding rules already checked above)
  return true;
}

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
  returns: v.id("contentAccessLog"),
  handler: async (ctx, args) => {
    // Get user's current marketing tags for the log
    const userTagAssignments = await ctx.db
      .query("userMarketingTags")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const userTagIds = userTagAssignments.map(
      (assignment) => assignment.marketingTagId,
    );

    return await ctx.db.insert("contentAccessLog", {
      userId: args.userId,
      contentType: args.contentType,
      contentId: args.contentId,
      accessGranted: args.accessGranted,
      reason: args.reason,
      accessedAt: Date.now(),
      userTags: userTagIds,
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
