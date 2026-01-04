/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { internalMutation } from "./_generated/server";

const vAny = v as any;
const internalMutationAny = internalMutation as any;

export const deleteVimeoDataForConnection = internalMutationAny({
  args: {
    connectionId: vAny.string(),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    const videos = await ctx.db
      .query("vimeoVideos")
      .withIndex("by_connection", (q: any) => q.eq("connectionId", args.connectionId))
      .collect();

    for (const video of videos) {
      await ctx.db.delete(video._id);
    }

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



