/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unnecessary-condition,
  @typescript-eslint/no-unnecessary-type-assertion
*/

import { v } from "convex/values";
import { query } from "../_generated/server";
import { components } from "../_generated/api";
import { resolveOrganizationId } from "./lib/resolve";

const tradeIdeasIdeas = (components.launchthat_traderlaunchpad.tradeIdeas as any).ideas as any;
const publicOrders = (components.launchthat_traderlaunchpad as any).publicOrders as any;

// Public query: resolves a shared trade idea by shareToken (no auth required).
export const getSharedTradeIdeaByToken = query({
  args: { shareToken: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(tradeIdeasIdeas.getSharedTradeIdeaByToken, {
      shareToken: args.shareToken,
    });
  },
});

const slugifyUsername = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

// Public query: resolves a trade idea by id, allowing access if:
// - idea is public, OR
// - ?code matches idea.shareToken (shareable link)
export const getPublicTradeIdea = query({
  args: {
    username: v.string(),
    tradeIdeaId: v.string(),
    code: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const orgId = resolveOrganizationId();

    const raw = String(args.username ?? "").trim().toLowerCase();
    const canonical = slugifyUsername(raw);
    const dotVariant = canonical.replace(/-/g, ".");
    const candidates = Array.from(new Set([raw, canonical, dotVariant].filter(Boolean)));

    let user: any = null;
    for (const c of candidates) {
      user =
        (await ctx.db
          .query("users")
          .withIndex("by_public_username", (q: any) => q.eq("publicUsername", c))
          .first()) ?? null;
      if (user) break;
    }
    if (!user) return null;

    const clerkId =
      typeof (user as any).clerkId === "string" && String((user as any).clerkId).trim()
        ? String((user as any).clerkId).trim()
        : null;
    if (!clerkId) return null;

    const tradeIdeaId = String(args.tradeIdeaId ?? "").trim();
    if (!tradeIdeaId) return null;

    return await ctx.runQuery(tradeIdeasIdeas.getPublicTradeIdeaById, {
      organizationId: orgId,
      expectedUserId: clerkId,
      tradeIdeaId: tradeIdeaId as any,
      code: args.code,
    });
  },
});

// Public query: list public trade ideas for a given username.
export const listPublicTradeIdeas = query({
  args: {
    username: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const orgId = resolveOrganizationId();

    const raw = String(args.username ?? "").trim().toLowerCase();
    const canonical = slugifyUsername(raw);
    const dotVariant = canonical.replace(/-/g, ".");
    const candidates = Array.from(new Set([raw, canonical, dotVariant].filter(Boolean)));

    let user: any = null;
    for (const c of candidates) {
      user =
        (await ctx.db
          .query("users")
          .withIndex("by_public_username", (q: any) => q.eq("publicUsername", c))
          .first()) ?? null;
      if (user) break;
    }
    if (!user) return [];

    const clerkId =
      typeof (user as any).clerkId === "string" && String((user as any).clerkId).trim()
        ? String((user as any).clerkId).trim()
        : null;
    if (!clerkId) return [];

    return await ctx.runQuery(tradeIdeasIdeas.listPublicTradeIdeasForUser, {
      organizationId: orgId,
      expectedUserId: clerkId,
      limit: args.limit,
    });
  },
});

export const listPublicOrders = query({
  args: {
    username: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const orgId = resolveOrganizationId();

    const raw = String(args.username ?? "").trim().toLowerCase();
    const canonical = slugifyUsername(raw);
    const dotVariant = canonical.replace(/-/g, ".");
    const candidates = Array.from(new Set([raw, canonical, dotVariant].filter(Boolean)));

    let user: any = null;
    for (const c of candidates) {
      user =
        (await ctx.db
          .query("users")
          .withIndex("by_public_username", (q: any) => q.eq("publicUsername", c))
          .first()) ?? null;
      if (user) break;
    }
    if (!user) return [];

    const clerkId =
      typeof (user as any).clerkId === "string" && String((user as any).clerkId).trim()
        ? String((user as any).clerkId).trim()
        : null;
    if (!clerkId) return [];

    return await ctx.runQuery(publicOrders.listPublicOrdersForUser, {
      organizationId: orgId,
      userId: clerkId,
      limit: args.limit,
    });
  },
});

