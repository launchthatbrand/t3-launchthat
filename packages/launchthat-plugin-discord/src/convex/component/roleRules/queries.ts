import { v } from "convex/values";
import { query } from "../server";

export const listRoleRulesForProduct = query({
  args: { organizationId: v.string(), productId: v.string() },
  returns: v.array(
    v.object({
      guildId: v.optional(v.string()),
      roleId: v.string(),
      roleName: v.optional(v.string()),
      enabled: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("roleRules")
      .withIndex("by_organizationId_and_productId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("productId", args.productId),
      )
      .collect();

    return rows.map((row: any) => ({
      guildId:
        typeof row.guildId === "string" && row.guildId.trim()
          ? String(row.guildId)
          : undefined,
      roleId: String(row.roleId ?? ""),
      roleName:
        typeof row.roleName === "string" && row.roleName.trim()
          ? String(row.roleName)
          : undefined,
      enabled: Boolean(row.enabled),
    }));
  },
});

export const listRoleRulesForMarketingTags = query({
  args: { organizationId: v.string(), marketingTagIds: v.array(v.string()) },
  returns: v.array(
    v.object({
      marketingTagId: v.string(),
      guildId: v.optional(v.string()),
      roleId: v.string(),
      roleName: v.optional(v.string()),
      enabled: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const results: Array<{
      marketingTagId: string;
      guildId?: string;
      roleId: string;
      roleName?: string;
      enabled: boolean;
    }> = [];
    const unique = Array.from(new Set(args.marketingTagIds)).filter(Boolean);

    for (const marketingTagId of unique) {
      const rows = await ctx.db
        .query("roleRules")
        .withIndex("by_organizationId_and_marketingTagId", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("marketingTagId", marketingTagId),
        )
        .collect();
      for (const row of rows) {
        results.push({
          marketingTagId,
          guildId:
            typeof (row as any).guildId === "string" && (row as any).guildId.trim()
              ? String((row as any).guildId)
              : undefined,
          roleId: String((row as any).roleId ?? ""),
          roleName:
            typeof (row as any).roleName === "string" && (row as any).roleName.trim()
              ? String((row as any).roleName)
              : undefined,
          enabled: Boolean((row as any).enabled),
        });
      }
    }

    return results;
  },
});

export const listRoleRulesForOrgKind = query({
  args: {
    organizationId: v.string(),
    kind: v.union(v.literal("product"), v.literal("marketingTag")),
  },
  returns: v.array(
    v.object({
      guildId: v.optional(v.string()),
      roleId: v.string(),
      roleName: v.optional(v.string()),
      enabled: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("roleRules")
      .withIndex("by_organizationId_and_kind", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("kind", args.kind),
      )
      .collect();
    return rows.map((row: any) => ({
      guildId:
        typeof row.guildId === "string" && row.guildId.trim()
          ? String(row.guildId)
          : undefined,
      roleId: String(row.roleId ?? ""),
      roleName:
        typeof row.roleName === "string" && row.roleName.trim()
          ? String(row.roleName)
          : undefined,
      enabled: Boolean(row.enabled),
    }));
  },
});


