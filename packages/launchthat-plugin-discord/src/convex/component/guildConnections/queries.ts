import { v } from "convex/values";

import { query } from "../server";

export const listGuildConnectionsForOrg = query({
  args: { organizationId: v.string() },
  returns: v.array(
    v.object({
      guildId: v.string(),
      guildName: v.optional(v.string()),
      botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
      connectedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("guildConnections")
      .withIndex("by_organizationId", (q: any) =>
        q.eq("organizationId", args.organizationId),
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
  args: { guildId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      organizationId: v.string(),
      guildId: v.string(),
      guildName: v.optional(v.string()),
      botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
      connectedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("guildConnections")
      .withIndex("by_guildId", (q: any) => q.eq("guildId", args.guildId))
      .first();
    if (!row) return null;
    return {
      organizationId: String((row as any).organizationId ?? ""),
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



