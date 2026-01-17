import { v } from "convex/values";

import { components } from "../../_generated/api";
import { query } from "../../_generated/server";
import { requireOrgAdmin, requireOrgMember } from "./permissions";

const onboardingQueries = components.launchthat_onboarding.queries as any;

export const getOnboardingConfig = query({
  args: { organizationId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgAdmin, { organizationId: args.organizationId });
    return await ctx.runQuery(onboardingQueries.getOnboardingConfig, args);
  },
});

export const getOnboardingStatus = query({
  args: { organizationId: v.string(), userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgMember, { organizationId: args.organizationId });
    return await ctx.runQuery(onboardingQueries.getOnboardingStatus, args);
  },
});
