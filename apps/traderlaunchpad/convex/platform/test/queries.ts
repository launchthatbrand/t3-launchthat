import { components, internal } from "../../_generated/api";
import { query } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Platform Tests helper: list ALL connected Discord guilds across the platform.
 * This is platform-admin only, and is intended to power dropdowns in `/platform/tests`.
 */
export const listDiscordGuildsForPlatformTests = query({
  args: {
    limitOrgs: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      organizationId: v.string(),
      guildId: v.string(),
      guildName: v.optional(v.string()),
      botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
      connectedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});

    const limitOrgs = Math.max(1, Math.min(5000, Math.floor(args.limitOrgs ?? 2000)));

    // Pull all orgs from core tenant component, then aggregate guild connections per org.
    const orgRowsUnknown = await ctx.runQuery(components.launchthat_core_tenant.queries.listOrganizations, {
      limit: limitOrgs,
    } as any);
    const orgs = Array.isArray(orgRowsUnknown) ? (orgRowsUnknown as any[]) : [];

    const byGuildId = new Map<
      string,
      {
        organizationId: string;
        guildId: string;
        guildName?: string;
        botModeAtConnect: "global" | "custom";
        connectedAt: number;
      }
    >();

    for (const o of orgs) {
      const organizationId = typeof o?._id === "string" ? o._id.trim() : "";
      if (!organizationId) continue;

      const rowsUnknown = await ctx.runQuery(
        components.launchthat_discord.guildConnections.queries.listGuildConnectionsForOrg,
        { organizationId },
      );
      const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];
      for (const r of rows) {
        const guildId = typeof r?.guildId === "string" ? r.guildId.trim() : "";
        if (!guildId) continue;
        const candidate = {
          organizationId,
          guildId,
          guildName: typeof r?.guildName === "string" ? r.guildName : undefined,
          botModeAtConnect: r?.botModeAtConnect === "custom" ? ("custom" as const) : ("global" as const),
          connectedAt: typeof r?.connectedAt === "number" ? r.connectedAt : 0,
        };

        const prev = byGuildId.get(guildId);
        if (!prev || candidate.connectedAt > prev.connectedAt) {
          byGuildId.set(guildId, candidate);
        }
      }
    }

    return Array.from(byGuildId.values()).sort((a, b) => b.connectedAt - a.connectedAt);
  },
});

