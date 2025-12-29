/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { v } from "convex/values";

import { internalMutation } from "../_generated/server";

const vAny = v as any;
const internalMutationAny = internalMutation as any;

export const deleteVimeoDataForConnection = internalMutationAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    // Remove all videos for this connection (prevents duplicates after disconnect/reconnect).
    const videos = await ctx.db
      .query("vimeoVideos")
      .withIndex("by_connection", (q: any) => q.eq("connectionId", args.connectionId))
      .collect();

    for (const video of videos) {
      await ctx.db.delete(video._id);
    }

    // Remove sync state for this connection (otherwise the UI may show stale running/error state).
    const state = await ctx.db
      .query("vimeoSyncState")
      .withIndex("by_connectionId", (q: any) => q.eq("connectionId", args.connectionId))
      .unique();
    if (state) {
      await ctx.db.delete(state._id);
    }

    return null;
  },
});


