import { v } from "convex/values";

import { api, components } from "../../_generated/api";
import { mutation } from "../../_generated/server";

const onboardingMutations = components.launchthat_onboarding.mutations as any;

const requireOrgAdminRef = api.plugins.onboarding.permissions.requireOrgAdmin;
const requireOrgMemberRef = api.plugins.onboarding.permissions.requireOrgMember;

export const upsertOnboardingConfig = mutation({
  args: {
    organizationId: v.string(),
    enabled: v.boolean(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    ctaRoute: v.optional(v.string()),
    steps: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        route: v.optional(v.string()),
        required: v.optional(v.boolean()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgAdminRef, { organizationId: args.organizationId });
    await ctx.runMutation(onboardingMutations.upsertOnboardingConfig, args);
    return null;
  },
});

export const setStepComplete = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    stepId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgMemberRef, { organizationId: args.organizationId });
    await ctx.runMutation(onboardingMutations.setStepComplete, args);
    return null;
  },
});

export const markOnboardingComplete = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(requireOrgMemberRef, { organizationId: args.organizationId });
    await ctx.runMutation(onboardingMutations.markOnboardingComplete, args);
    return null;
  },
});
