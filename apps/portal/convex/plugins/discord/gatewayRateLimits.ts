/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-argument
*/
import { RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { components } from "../../_generated/api";
import { internalMutation } from "../../_generated/server";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Anti-abuse: limit how often a single Discord user can trigger AI replies in a single thread.
  // Allows small bursts, but enforces a steady pace.
  discordSupportUserThread: {
    kind: "token bucket",
    rate: 3,
    period: 60_000,
    capacity: 6,
  },
  // Anti-spam: cap how many AI replies a single Discord thread can trigger.
  discordSupportThread: {
    kind: "token bucket",
    rate: 10,
    period: 600_000,
    capacity: 10,
  },
  // UX: suppress repeated “slow down” notices.
  discordSupportRateLimitNotice: {
    kind: "token bucket",
    rate: 1,
    period: 30_000,
    capacity: 1,
  },
  // UX: suppress repeated “Support AI disabled” notices.
  discordSupportDisabledNotice: {
    kind: "token bucket",
    rate: 1,
    period: 30_000,
    capacity: 1,
  },
});

const DAY_MS = 86_400_000;

const startOfUtcDayMs = (nowMs: number) => Math.floor(nowMs / DAY_MS) * DAY_MS;

export const enforceDiscordSupportRateLimits = internalMutation({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    threadId: v.string(),
    authorId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userThreadKey = `${args.guildId}:${args.threadId}:${args.authorId}`;
    const threadKey = `${args.guildId}:${args.threadId}`;

    const userThread = await rateLimiter.limit(
      ctx,
      "discordSupportUserThread",
      {
        key: userThreadKey,
      },
    );
    if (!userThread.ok) {
      const retryAt = Date.now() + userThread.retryAfter;
      throw new ConvexError({
        kind: "RateLimited",
        name: "discordSupportUserThread",
        retryAt,
      });
    }

    const thread = await rateLimiter.limit(ctx, "discordSupportThread", {
      key: threadKey,
    });
    if (!thread.ok) {
      const retryAt = Date.now() + thread.retryAfter;
      throw new ConvexError({
        kind: "RateLimited",
        name: "discordSupportThread",
        retryAt,
      });
    }

    // Cost control: cap total AI replies per organization per day using the organization's plan limit.
    const organization = await ctx.db.get(
      args.organizationId as Id<"organizations">,
    );
    if (!organization) {
      throw new Error("Organization not found");
    }

    const planId = organization.planId;
    const plan = planId
      ? ((await ctx.runQuery(
          components.launchthat_ecommerce.plans.queries.getPlanById as any,
          { planId: String(planId) },
        )) as any)
      : ((await ctx.runQuery(
          components.launchthat_ecommerce.plans.queries.getPlanByName as any,
          { name: "free" },
        )) as any);

    const discordAiDailyLimit =
      typeof plan?.limits?.discordAiDaily === "number"
        ? plan.limits.discordAiDaily
        : 200;

    const now = Date.now();
    const windowStartMs = startOfUtcDayMs(now);
    const scope = null;
    const existing = await ctx.db
      .query("orgUsageCounters")
      .withIndex("by_org_kind_scope_window", (q) =>
        q
          .eq("organizationId", organization._id)
          .eq("kind", "discordAiDaily")
          .eq("scope", scope)
          .eq("windowStartMs", windowStartMs),
      )
      .unique();

    const nextCount = (existing?.count ?? 0) + 1;
    if (nextCount > discordAiDailyLimit) {
      throw new ConvexError({
        kind: "RateLimited",
        name: "discordSupportOrgDaily",
        retryAt: windowStartMs + DAY_MS,
      });
    }

    if (existing?._id) {
      await ctx.db.patch(existing._id, { count: nextCount, updatedAt: now });
    } else {
      await ctx.db.insert("orgUsageCounters", {
        organizationId: organization._id,
        kind: "discordAiDaily",
        scope,
        windowStartMs,
        count: nextCount,
        updatedAt: now,
      });
    }

    return null;
  },
});

export const shouldPostDiscordSupportRateLimitNotice = internalMutation({
  args: {
    guildId: v.string(),
    threadId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const key = `${args.guildId}:${args.threadId}`;
    const notice = await rateLimiter.limit(
      ctx,
      "discordSupportRateLimitNotice",
      {
        key,
      },
    );
    return notice.ok;
  },
});

export const shouldPostDiscordSupportDisabledNotice = internalMutation({
  args: {
    guildId: v.string(),
    threadId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const key = `${args.guildId}:${args.threadId}`;
    const notice = await rateLimiter.limit(
      ctx,
      "discordSupportDisabledNotice",
      {
        key,
      },
    );
    return notice.ok;
  },
});
