/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const commerceFunnelsMutations = components.launchthat_ecommerce.funnels
  .mutations as any;
const commerceFunnelStepsMutations = components.launchthat_ecommerce.funnelSteps
  .mutations as any;

export const ensureDefaultFunnel = mutation({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const funnelId: string = await ctx.runMutation(
      commerceFunnelsMutations.ensureDefaultFunnel,
      args,
    );

    await ctx.runMutation(commerceFunnelStepsMutations.ensureDefaultFunnelSteps, {
      organizationId: args.organizationId,
    });

    return funnelId;
  },
});


