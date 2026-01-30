import { v } from "convex/values";

import { query } from "../server";

export const listGuildConnectionsForOrg = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      guildId: v.string(),
      guildName: v.optional(v.string()),
      botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
      connectedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return [];
    const rows = await ctx.db
      .query("guildConnections")
      .withIndex(scope === "org" ? "by_organizationId" : "by_scope", (q: any) =>
        scope === "org" ? q.eq("organizationId", organizationId) : q.eq("scope", scope),
      )
      .collect();

    return rows.map((row: any) => ({
      guildId: String(row.guildId ?? ""),
      guildName:
        typeof row.guildName === "string" ? (row.guildName as string) : undefined,
      botModeAtConnect:
        row.botModeAtConnect === "custom" ? ("custom" as const) : ("global" as const),
      connectedAt: Number(row.connectedAt ?? 0),
    }));
  },
});

export const getGuildConnectionByGuildId = query({
  args: { guildId: v.string(), scope: v.optional(v.union(v.literal("org"), v.literal("platform"))) },
  returns: v.union(
    v.null(),
    v.object({
      scope: v.union(v.literal("org"), v.literal("platform")),
      organizationId: v.optional(v.string()),
      guildId: v.string(),
      guildName: v.optional(v.string()),
      botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
      connectedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const row = await ctx.db
      .query("guildConnections")
      .withIndex("by_scope_and_guildId", (q: any) =>
        q.eq("scope", scope).eq("guildId", args.guildId),
      )
      .first();
    if (!row) return null;
    return {
      scope: (row as any).scope === "platform" ? ("platform" as const) : ("org" as const),
      organizationId: (row as any).organizationId,
      guildId: String((row as any).guildId ?? ""),
      guildName:
        typeof (row as any).guildName === "string"
          ? ((row as any).guildName as string)
          : undefined,
      botModeAtConnect:
        (row as any).botModeAtConnect === "custom"
          ? ("custom" as const)
          : ("global" as const),
      connectedAt: Number((row as any).connectedAt ?? 0),
    };
  },
});



