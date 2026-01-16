"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  turbo/no-undeclared-env-vars
*/
import { v } from "convex/values";

import { internalAction } from "../../_generated/server";

// NOTE: Avoid typed imports here (can cause TS deep instantiation errors).
const internal: any = require("../../_generated/api").internal;
const components: any = require("../../_generated/api").components;

export const syncTradeLockerConnection = internalAction({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    ordersUpserted: v.number(),
    executionsUpserted: v.number(),
    executionsNew: v.number(),
    groupsTouched: v.number(),
    tradeIdeaGroupIds: v.array(v.id("tradeIdeaGroups")),
  }),
  handler: async (ctx, args) => {
    const result: any = await ctx.runAction(
      components.launchthat_traderlaunchpad.sync.syncTradeLockerConnection,
      {
        organizationId: args.organizationId,
        userId: args.userId,
        limit: args.limit,
        secretsKey: process.env.TRADELOCKER_SECRETS_KEY ?? "",
        tokenStorage: (process.env.TRADELOCKER_TOKEN_STORAGE ?? "enc") as
          | "raw"
          | "enc",
      },
    );

    const ids = Array.isArray(result?.tradeIdeaGroupIds)
      ? result.tradeIdeaGroupIds
      : [];

    for (const tradeIdeaGroupId of ids) {
      try {
        await ctx.runAction(
          internal.plugins.traderlaunchpad.discord
            .upsertTradeIdeaDiscordMessage,
          {
            organizationId: args.organizationId,
            tradeIdeaGroupId,
          },
        );
      } catch {
        // ignore
      }
    }

    return {
      ordersUpserted: Number(result?.ordersUpserted ?? 0),
      executionsUpserted: Number(result?.executionsUpserted ?? 0),
      executionsNew: Number(result?.executionsNew ?? 0),
      groupsTouched: Number(result?.groupsTouched ?? 0),
      tradeIdeaGroupIds: ids,
    };
  },
});
