/**
 * Export all helpers from the downloads/lib module
 */

import { v } from "convex/values";

import { query } from "../../_generated/server";
import { getAuthenticatedUser } from "./helpers";

export * from "./fileTypeUtils";
export * from "./helpers";

/**
 * Get downloads associated with a specific group
 */
export const getGroupDownloads = query({
  args: {
    groupId: v.id("groups"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // No need to get authenticated user here since this is just displaying
    // the group's downloads in a widget

    // Default limit if not provided
    const limit = args.limit ?? 5;

    // Query downloads that are associated with this group
    // Since there's no direct group relationship in the downloads schema,
    // we'll need to get downloads marked as accessible to this group
    // For now, we'll return recent public downloads as a placeholder
    const downloads = await ctx.db
      .query("downloads")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(limit);

    // Enhance with uploader information
    const result = [];
    for (const download of downloads) {
      let uploader = null;
      if (download.uploadedBy) {
        const user = await ctx.db.get(download.uploadedBy);
        if (user) {
          uploader = {
            name: user.name,
            image: user.image,
          };
        }
      }

      result.push({
        ...download,
        uploader,
      });
    }

    return result;
  },
});
