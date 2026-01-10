import { v } from "convex/values";
import { mutation } from "../server";

const roleRuleV2 = v.object({
  guildId: v.string(),
  roleId: v.string(),
  roleName: v.optional(v.string()),
});

export const replaceProductRoleRules = mutation({
  args: {
    organizationId: v.string(),
    productId: v.string(),
    rules: v.array(roleRuleV2),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const uniqueRules = Array.from(
      new Map(
        args.rules
          .map((r) => ({
            guildId: typeof r.guildId === "string" ? r.guildId.trim() : "",
            roleId: typeof r.roleId === "string" ? r.roleId.trim() : "",
            roleName:
              typeof r.roleName === "string" && r.roleName.trim()
                ? r.roleName.trim()
                : undefined,
          }))
          .filter((r) => r.guildId && r.roleId)
          .map((r) => [`${r.guildId}\u0000${r.roleId}`, r] as const),
      ).values(),
    );

    // Remove existing rules for this product.
    const existing = await ctx.db
      .query("roleRules")
      .withIndex("by_organizationId_and_productId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("productId", args.productId),
      )
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    for (const rule of uniqueRules) {
      await ctx.db.insert("roleRules", {
        organizationId: args.organizationId,
        guildId: rule.guildId,
        kind: "product",
        productId: args.productId,
        roleId: rule.roleId,
        roleName: rule.roleName,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

export const replaceMarketingTagRoleRules = mutation({
  args: {
    organizationId: v.string(),
    marketingTagId: v.string(),
    rules: v.array(roleRuleV2),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const uniqueRules = Array.from(
      new Map(
        args.rules
          .map((r) => ({
            guildId: typeof r.guildId === "string" ? r.guildId.trim() : "",
            roleId: typeof r.roleId === "string" ? r.roleId.trim() : "",
            roleName:
              typeof r.roleName === "string" && r.roleName.trim()
                ? r.roleName.trim()
                : undefined,
          }))
          .filter((r) => r.guildId && r.roleId)
          .map((r) => [`${r.guildId}\u0000${r.roleId}`, r] as const),
      ).values(),
    );

    const existing = await ctx.db
      .query("roleRules")
      .withIndex("by_organizationId_and_marketingTagId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("marketingTagId", args.marketingTagId),
      )
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    for (const rule of uniqueRules) {
      await ctx.db.insert("roleRules", {
        organizationId: args.organizationId,
        guildId: rule.guildId,
        kind: "marketingTag",
        marketingTagId: args.marketingTagId,
        roleId: rule.roleId,
        roleName: rule.roleName,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

const roleRuleInput = v.object({
  kind: v.union(v.literal("product"), v.literal("marketingTag")),
  productId: v.optional(v.string()),
  marketingTagId: v.optional(v.string()),
  guildId: v.optional(v.string()),
  roleId: v.string(),
  roleName: v.optional(v.string()),
  enabled: v.boolean(),
});

export const replaceOrgRoleRules = mutation({
  args: {
    organizationId: v.string(),
    rules: v.array(roleRuleInput),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Delete existing rules for org.
    for await (const row of ctx.db
      .query("roleRules")
      .withIndex("by_organizationId_and_kind", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("kind", "product"),
      )) {
      await ctx.db.delete(row._id);
    }
    for await (const row of ctx.db
      .query("roleRules")
      .withIndex("by_organizationId_and_kind", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("kind", "marketingTag"),
      )) {
      await ctx.db.delete(row._id);
    }

    // Insert new rules.
    for (const rule of args.rules) {
      await ctx.db.insert("roleRules", {
        organizationId: args.organizationId,
        guildId:
          typeof rule.guildId === "string" && rule.guildId.trim()
            ? rule.guildId.trim()
            : undefined,
        kind: rule.kind,
        productId: rule.kind === "product" ? rule.productId : undefined,
        marketingTagId:
          rule.kind === "marketingTag" ? rule.marketingTagId : undefined,
        roleId: rule.roleId,
        roleName:
          typeof rule.roleName === "string" && rule.roleName.trim()
            ? rule.roleName.trim()
            : undefined,
        enabled: rule.enabled,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});


