import { v } from "convex/values";

import { mutation } from "../server";

export const upsertGuildConnection = mutation({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    guildName: v.optional(v.string()),
    botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
    connectedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) {
      throw new Error("organizationId is required when scope=org");
    }
    const existing = await ctx.db
      .query("guildConnections")
      .withIndex("by_scope_and_organizationId_and_guildId", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId).eq("guildId", args.guildId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        guildName: args.guildName,
        botModeAtConnect: args.botModeAtConnect,
        connectedAt: args.connectedAt,
      });
      return null;
    }

    await ctx.db.insert("guildConnections", {
      scope,
      organizationId,
      guildId: args.guildId,
      guildName: args.guildName,
      botModeAtConnect: args.botModeAtConnect,
      connectedAt: args.connectedAt,
    });
    return null;
  },
});

export const deleteGuildConnection = mutation({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) {
      throw new Error("organizationId is required when scope=org");
    }
    const existing = await ctx.db
      .query("guildConnections")
      .withIndex("by_scope_and_organizationId_and_guildId", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId).eq("guildId", args.guildId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});


