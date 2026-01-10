import { RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";
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
});

export const enforceDiscordSupportRateLimits = internalMutation({
  args: {
    guildId: v.string(),
    threadId: v.string(),
    authorId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userThreadKey = `${args.guildId}:${args.threadId}:${args.authorId}`;
    const threadKey = `${args.guildId}:${args.threadId}`;

    const userThread = await rateLimiter.limit(ctx, "discordSupportUserThread", {
      key: userThreadKey,
    });
    if (!userThread.ok) {
      throw new ConvexError({
        kind: "RateLimited",
        name: "discordSupportUserThread",
        retryAt: userThread.retryAt,
      });
    }

    const thread = await rateLimiter.limit(ctx, "discordSupportThread", {
      key: threadKey,
    });
    if (!thread.ok) {
      throw new ConvexError({
        kind: "RateLimited",
        name: "discordSupportThread",
        retryAt: thread.retryAt,
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
    const notice = await rateLimiter.limit(ctx, "discordSupportRateLimitNotice", {
      key,
    });
    return notice.ok;
  },
});


