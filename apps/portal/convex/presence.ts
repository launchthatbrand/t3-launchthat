import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";

import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";

const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, args) => {
    const tokens = await presence.heartbeat(
      ctx,
      args.roomId,
      args.userId,
      args.sessionId,
      args.interval,
    );

    return tokens;
  },
});

export const list = query({
  args: {
    roomToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return presence.list(ctx, args.roomToken, args.limit ?? 25);
  },
});

export const disconnect = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await presence.disconnect(ctx, args.sessionToken);
    return null;
  },
});

export const updateRoomUser = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await presence.updateRoomUser(ctx, args.roomId, args.userId, args.data);
    return null;
  },
});
