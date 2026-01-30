import { v } from "convex/values";
import { query } from "../server";

export const getUserLink = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      scope: v.union(v.literal("org"), v.literal("platform")),
      organizationId: v.optional(v.string()),
      discordUserId: v.string(),
      linkedAt: v.number(),
      discordUsername: v.optional(v.string()),
      discordDiscriminator: v.optional(v.string()),
      discordGlobalName: v.optional(v.string()),
      discordAvatar: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return null;
    const link = await ctx.db
      .query("userLinks")
      .withIndex(
        scope === "org" ? "by_organizationId_and_userId" : "by_scope_and_userId",
        (q: any) =>
          scope === "org"
            ? q.eq("organizationId", organizationId).eq("userId", args.userId)
            : q.eq("scope", scope).eq("userId", args.userId),
      )
      .unique();
    if (!link) return null;
    return {
      scope: link.scope === "platform" ? ("platform" as const) : ("org" as const),
      organizationId: link.organizationId,
      discordUserId: link.discordUserId,
      linkedAt: link.linkedAt,
      discordUsername: link.discordUsername,
      discordDiscriminator: link.discordDiscriminator,
      discordGlobalName: link.discordGlobalName,
      discordAvatar: link.discordAvatar,
    };
  },
});

export const getUserLinkForUser = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      discordUserId: v.string(),
      linkedAt: v.number(),
      organizationId: v.optional(v.string()),
      scope: v.union(v.literal("org"), v.literal("platform")),
      discordUsername: v.optional(v.string()),
      discordDiscriminator: v.optional(v.string()),
      discordGlobalName: v.optional(v.string()),
      discordAvatar: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const link = await ctx.db
      .query("userLinks")
      .withIndex("by_scope_and_userId", (q: any) =>
        q.eq("scope", scope).eq("userId", args.userId),
      )
      .unique();
    if (!link) return null;
    return {
      discordUserId: link.discordUserId,
      linkedAt: link.linkedAt,
      organizationId: link.organizationId,
      scope: link.scope === "platform" ? ("platform" as const) : ("org" as const),
      discordUsername: link.discordUsername,
      discordDiscriminator: link.discordDiscriminator,
      discordGlobalName: link.discordGlobalName,
      discordAvatar: link.discordAvatar,
    };
  },
});
export const getUserIdByDiscordUserId = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    discordUserId: v.string(),
  },
  returns: v.union(
    v.object({
      userId: v.string(),
      linkedAt: v.number(),
      discordUsername: v.optional(v.string()),
      discordDiscriminator: v.optional(v.string()),
      discordGlobalName: v.optional(v.string()),
      discordAvatar: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return null;
    const link = await ctx.db
      .query("userLinks")
      .withIndex(
        scope === "org"
          ? "by_organizationId_and_discordUserId"
          : "by_scope_and_discordUserId",
        (q: any) =>
          scope === "org"
            ? q.eq("organizationId", organizationId).eq("discordUserId", args.discordUserId)
            : q.eq("scope", scope).eq("discordUserId", args.discordUserId),
      )
      .unique();
    if (!link) return null;
    return {
      userId: link.userId,
      linkedAt: link.linkedAt,
      discordUsername: link.discordUsername,
      discordDiscriminator: link.discordDiscriminator,
      discordGlobalName: link.discordGlobalName,
      discordAvatar: link.discordAvatar,
    };
  },
});



