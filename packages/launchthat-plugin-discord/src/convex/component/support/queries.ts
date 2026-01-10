import { v } from "convex/values";

import { query } from "../server";

export const hasAiRunForTriggerMessage = query({
  args: { guildId: v.string(), triggerMessageId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("supportAiRuns")
      .withIndex("by_guildId_and_triggerMessageId", (q: any) =>
        q
          .eq("guildId", args.guildId)
          .eq("triggerMessageId", args.triggerMessageId),
      )
      .first();
    return Boolean(row);
  },
});


