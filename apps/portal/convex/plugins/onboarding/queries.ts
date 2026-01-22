import { v } from "convex/values";

import { api, components } from "../../_generated/api";
import { query } from "../../_generated/server";

const onboardingQueries = components.launchthat_onboarding.queries as any;

const requireOrgAdminRef = api.plugins.onboarding.permissions.requireOrgAdmin;
const requireOrgMemberRef = api.plugins.onboarding.permissions.requireOrgMember;

export const getOnboardingConfig = query({
  args: { organizationId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgAdminRef, { organizationId: args.organizationId });
    return await ctx.runQuery(onboardingQueries.getOnboardingConfig, args);
  },
});

export const getOnboardingStatus = query({
  args: { organizationId: v.string(), userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgMemberRef, { organizationId: args.organizationId });
    return await ctx.runQuery(onboardingQueries.getOnboardingStatus, args);
  },
});
