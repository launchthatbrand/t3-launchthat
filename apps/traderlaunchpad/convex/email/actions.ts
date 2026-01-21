import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { action } from "../_generated/server";

interface EmailActions {
  syncEmailDomain: FunctionReference<"action", "public", { orgId: any }, unknown>;
}

const emailActions = (() => {
  const componentsAny = components as unknown as { launchthat_email?: { actions?: unknown } };
  return (componentsAny.launchthat_email?.actions ?? {}) as EmailActions;
})();

export const syncEmailDomain = action({
  args: { orgId: v.string() },
  returns: v.object({
    emailDomain: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("unconfigured"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("error"),
    ),
    records: v.array(
      v.object({
        type: v.string(),
        name: v.string(),
        value: v.string(),
      }),
    ),
    lastError: v.optional(v.string()),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    return (await ctx.runAction(emailActions.syncEmailDomain, args as any)) as any;
  },
});

