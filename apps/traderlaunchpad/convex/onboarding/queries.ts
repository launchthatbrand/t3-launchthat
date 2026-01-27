import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { query } from "../_generated/server";
import {
  resolveOrganizationId,
  resolveViewerUserId,
} from "../traderlaunchpad/lib/resolve";

interface OnboardingQueries {
  getOnboardingStatus: FunctionReference<
    "query",
    "public",
    { organizationId: string; userId: string },
    unknown
  >;
}

const onboardingQueries = (() => {
  const componentsAny = components as unknown as {
    launchthat_onboarding?: { queries?: unknown };
  };
  const onboardingComponent = componentsAny.launchthat_onboarding;
  return (onboardingComponent?.queries ?? {}) as OnboardingQueries;
})();

export const getOnboardingStatus = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    // During initial auth hydration (or when signed out), this query may still be
    // invoked by client code. Avoid spamming server logs by returning a safe
    // non-blocking status instead of throwing.
    const ident = await ctx.auth.getUserIdentity();
    if (!ident?.subject) {
      return {
        shouldBlock: false,
        enabled: false,
        steps: [],
      };
    }

    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(onboardingQueries.getOnboardingStatus, {
      organizationId,
      userId,
    });
  },
});

export const getMyOnboardingStatus = getOnboardingStatus;
