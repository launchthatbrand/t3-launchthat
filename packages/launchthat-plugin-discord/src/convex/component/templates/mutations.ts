import { v } from "convex/values";

import { mutation } from "../server";

export const upsertTemplate = mutation({
  args: {
    organizationId: v.string(),
    guildId: v.optional(v.string()),
    kind: v.union(v.literal("tradeidea")),
    template: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const guildId = args.guildId ?? undefined;
    const existing = await ctx.db
      .query("messageTemplates")
      .withIndex("by_organizationId_and_guildId_and_kind", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("guildId", guildId)
          .eq("kind", args.kind),
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        template: args.template,
        guildId: args.guildId,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("messageTemplates", {
      organizationId: args.organizationId,
      guildId: args.guildId,
      kind: args.kind,
      template: args.template,
      updatedAt: now,
    });
    return null;
  },
});
