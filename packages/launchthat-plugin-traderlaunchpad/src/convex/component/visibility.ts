import { v } from "convex/values";
import { mutation, query } from "./server";

const defaults = () => ({
  globalPublic: false,
  tradeIdeasPublic: false,
  ordersPublic: false,
  positionsPublic: false,
  profilePublic: false,
  analyticsReportsPublic: false,
});

export const getMyVisibilitySettings = query({
  args: { organizationId: v.string(), userId: v.string() },
  returns: v.object({
    globalPublic: v.boolean(),
    tradeIdeasPublic: v.boolean(),
    ordersPublic: v.boolean(),
    positionsPublic: v.boolean(),
    profilePublic: v.boolean(),
    analyticsReportsPublic: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("visibilitySettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    const d = defaults();
    return {
      globalPublic: typeof row?.globalPublic === "boolean" ? row.globalPublic : d.globalPublic,
      tradeIdeasPublic:
        typeof row?.tradeIdeasPublic === "boolean" ? row.tradeIdeasPublic : d.tradeIdeasPublic,
      ordersPublic: typeof row?.ordersPublic === "boolean" ? row.ordersPublic : d.ordersPublic,
      positionsPublic:
        typeof row?.positionsPublic === "boolean" ? row.positionsPublic : d.positionsPublic,
      profilePublic: typeof row?.profilePublic === "boolean" ? row.profilePublic : d.profilePublic,
      analyticsReportsPublic:
        typeof row?.analyticsReportsPublic === "boolean"
          ? row.analyticsReportsPublic
          : d.analyticsReportsPublic,
    };
  },
});

export const upsertMyVisibilitySettings = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    globalPublic: v.boolean(),
    tradeIdeasPublic: v.boolean(),
    ordersPublic: v.boolean(),
    positionsPublic: v.boolean(),
    profilePublic: v.boolean(),
    analyticsReportsPublic: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("visibilitySettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    const next = {
      globalPublic: Boolean(args.globalPublic),
      tradeIdeasPublic: Boolean(args.tradeIdeasPublic),
      ordersPublic: Boolean(args.ordersPublic),
      positionsPublic: Boolean(args.positionsPublic),
      profilePublic: Boolean(args.profilePublic),
      analyticsReportsPublic: Boolean(args.analyticsReportsPublic),
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
    } else {
      await ctx.db.insert("visibilitySettings", {
        organizationId: args.organizationId,
        userId: args.userId,
        ...next,
      });
    }

    // Best-effort: if user turns on public defaults, make existing trade ideas public too
    // (matches the expectation that "global public" immediately reflects across their data).
    const effectiveTradeIdeasPublic = next.globalPublic ? true : next.tradeIdeasPublic;
    if (effectiveTradeIdeasPublic) {
      const ideas = await ctx.db
        .query("tradeIdeas")
        .withIndex("by_org_user_updatedAt", (q: any) =>
          q.eq("organizationId", args.organizationId).eq("userId", args.userId),
        )
        .order("desc")
        .take(2000);
      for (const idea of ideas) {
        if (idea.visibility === "public") continue;
        await ctx.db.patch(idea._id, {
          visibility: "public",
          shareToken:
            typeof idea.shareToken === "string" && idea.shareToken.trim()
              ? idea.shareToken
              : `${now.toString(36)}_${Math.random().toString(36).slice(2)}`.slice(0, 40),
          shareEnabledAt: typeof idea.shareEnabledAt === "number" ? idea.shareEnabledAt : now,
          updatedAt: now,
        });
      }
    }

    return null;
  },
});

