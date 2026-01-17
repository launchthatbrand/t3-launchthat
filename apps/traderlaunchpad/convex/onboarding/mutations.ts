import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation } from "../_generated/server";
import {
  resolveOrganizationId,
  resolveViewerUserId,
} from "../traderlaunchpad/lib/resolve";

const onboardingMutations = components.launchthat_onboarding.mutations as any;

export const setMyOnboardingStepComplete = mutation({
  args: { stepId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(onboardingMutations.setStepComplete, {
      organizationId,
      userId,
      stepId: args.stepId,
    });
    return null;
  },
});

export const markMyOnboardingComplete = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(onboardingMutations.markOnboardingComplete, {
      organizationId,
      userId,
    });
    return null;
  },
});
