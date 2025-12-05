import type { Doc, Id } from "../../_generated/dataModel";

import { query } from "../../_generated/server";
import { v } from "convex/values";

type ContactDoc = Doc<"contacts">;

// Get all unique tags for a user's contacts
export const getTags = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // If no userId is provided, return an empty array
    if (!userId) {
      return [];
    }

    // Get all contacts for this user
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
      .collect();

    // Extract and deduplicate tags
    const tagsSet = new Set<string>();
    contacts.forEach((contact) => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach((tag) => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  },
});
