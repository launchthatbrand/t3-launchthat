import { v } from "convex/values";

import { mutation } from "../_generated/server";

// --- TAG MANAGEMENT ON CONTACTS ---
export const addContactTag = mutation({
  args: { contactId: v.id("contacts"), tag: v.string() },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    const tags = contact.tags ?? [];
    if (!tags.includes(args.tag)) {
      tags.push(args.tag);
      await ctx.db.patch(args.contactId, { tags });
    }
    return true;
  },
});

export const removeContactTag = mutation({
  args: { contactId: v.id("contacts"), tag: v.string() },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    const tags = (contact.tags ?? []).filter((t) => t !== args.tag);
    await ctx.db.patch(args.contactId, { tags });
    return true;
  },
});
