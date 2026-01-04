/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { query } from "../_generated/server";

const vAny = v as any;
const queryAny = query as any;

export const getSyncStateByConnection = queryAny({
  args: { connectionId: vAny.string() },
  returns: vAny.any(),
  handler: async (ctx: any, args: any) => {
    const row = await ctx.db
      .query("vimeoSyncState")
      .withIndex("by_connectionId", (q: any) =>
        q.eq("connectionId", args.connectionId),
      )
      .unique();
    return row ?? null;
  },
});



