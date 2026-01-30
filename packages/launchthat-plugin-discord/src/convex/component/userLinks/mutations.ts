import { v } from "convex/values";
import { mutation } from "../server";

export const linkUser = mutation({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    userId: v.string(),
    discordUserId: v.string(),
    discordUsername: v.optional(v.string()),
    discordDiscriminator: v.optional(v.string()),
    discordGlobalName: v.optional(v.string()),
    discordAvatar: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) {
      throw new Error("organizationId is required when scope=org");
    }
    const existing = await ctx.db
      .query("userLinks")
      .withIndex(
        scope === "org" ? "by_organizationId_and_userId" : "by_scope_and_userId",
        (q: any) =>
          scope === "org"
            ? q.eq("organizationId", organizationId).eq("userId", args.userId)
            : q.eq("scope", scope).eq("userId", args.userId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        discordUserId: args.discordUserId,
        discordUsername: args.discordUsername,
        discordDiscriminator: args.discordDiscriminator,
        discordGlobalName: args.discordGlobalName,
        discordAvatar: args.discordAvatar,
        linkedAt: Date.now(),
      });
      return null;
    }

    await ctx.db.insert("userLinks", {
      scope,
      organizationId,
      userId: args.userId,
      discordUserId: args.discordUserId,
      discordUsername: args.discordUsername,
      discordDiscriminator: args.discordDiscriminator,
      discordGlobalName: args.discordGlobalName,
      discordAvatar: args.discordAvatar,
      linkedAt: Date.now(),
    });
    return null;
  },
});

export const unlinkUser = mutation({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) {
      throw new Error("organizationId is required when scope=org");
    }
    const existing = await ctx.db
      .query("userLinks")
      .withIndex(
        scope === "org" ? "by_organizationId_and_userId" : "by_scope_and_userId",
        (q: any) =>
          scope === "org"
            ? q.eq("organizationId", organizationId).eq("userId", args.userId)
            : q.eq("scope", scope).eq("userId", args.userId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});



