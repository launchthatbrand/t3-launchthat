import { v } from "convex/values";

import { query } from "../_generated/server";

const normalizeCouponCode = (value: string): string =>
  value.trim().toUpperCase().replace(/\s+/g, "");

export const listDiscountCodes = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const orgId =
      typeof args.organizationId === "string" ? args.organizationId : null;
    return await ctx.db
      .query("discountCodes")
      .withIndex("by_org_and_active", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .collect();
  },
});

export const getDiscountCodeByCode = query({
  args: {
    organizationId: v.optional(v.string()),
    code: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const code = normalizeCouponCode(args.code);
    if (!code) return null;

    const orgId =
      typeof args.organizationId === "string" ? args.organizationId : null;

    // First try org-specific, then fall back to global (null orgId).
    const orgMatch =
      (await ctx.db
        .query("discountCodes")
        .withIndex("by_org_and_code", (q) =>
          q.eq("organizationId", orgId).eq("code", code),
        )
        .unique()) ?? null;
    if (orgMatch) return orgMatch;

    if (orgId !== null) {
      const globalMatch =
        (await ctx.db
          .query("discountCodes")
          .withIndex("by_org_and_code", (q) =>
            q.eq("organizationId", null).eq("code", code),
          )
          .unique()) ?? null;
      return globalMatch;
    }

    return null;
  },
});
