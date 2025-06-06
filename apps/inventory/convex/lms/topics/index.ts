import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

// Topics logic will be moved here
export {};

// --- Create Topic Mutation ---
export const create = mutation({
  args: {
    title: v.string(),
    // Optional args based on updated schema (can be added later to form)
    contentType: v.optional(
      v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
    ),
    content: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Provide default values for required fields when creating unattached
    const newTopicId = await ctx.db.insert("topics", {
      title: args.title,
      lessonId: undefined, // Explicitly unattached
      contentType: args.contentType ?? "text", // Default to text if not provided
      order: undefined, // Explicitly unattached
      content: args.content, // Pass through if provided
      isPublished: args.isPublished ?? false, // Default to unpublished
    });

    console.log(`Created new topic with ID: ${newTopicId}`);
    return newTopicId;
  },
});

// --- Other Topic Mutations/Queries (placeholder) ---
// export const update = mutation({...});
// export const remove = mutation({...});
// export const get = query({...});
