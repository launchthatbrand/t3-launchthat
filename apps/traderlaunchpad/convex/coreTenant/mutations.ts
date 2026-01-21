import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation } from "../_generated/server";

interface CoreTenantMutations {
  createOrGetUser: FunctionReference<"mutation", "public", Record<string, never>, unknown>;
}

const coreTenantMutations = (() => {
  const componentsAny = components as unknown as {
    launchthat_core_tenant?: { mutations?: unknown };
  };
  return (componentsAny.launchthat_core_tenant?.mutations ?? {}) as CoreTenantMutations;
})();

export const createOrGetUser = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.runMutation(coreTenantMutations.createOrGetUser, {});
  },
});

