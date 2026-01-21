import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation } from "../_generated/server";

interface EmailMutations {
  upsertEmailSettings: FunctionReference<
    "mutation",
    "public",
    {
      orgId: any;
      enabled: boolean;
      fromName: string;
      fromMode: "portal" | "custom";
      fromLocalPart: string;
      replyToEmail?: string;
      designKey?: "clean" | "bold" | "minimal";
    },
    null
  >;
  setEmailDomain: FunctionReference<
    "mutation",
    "public",
    { orgId: any; domain?: string },
    null
  >;
  enqueueTestEmail: FunctionReference<
    "mutation",
    "public",
    { orgId: any; to: string },
    unknown
  >;
}

const emailMutations = (() => {
  const componentsAny = components as unknown as { launchthat_email?: { mutations?: unknown } };
  return (componentsAny.launchthat_email?.mutations ?? {}) as EmailMutations;
})();

export const upsertEmailSettings = mutation({
  args: {
    orgId: v.string(),
    enabled: v.boolean(),
    fromName: v.string(),
    fromMode: v.union(v.literal("portal"), v.literal("custom")),
    fromLocalPart: v.string(),
    replyToEmail: v.optional(v.string()),
    designKey: v.optional(
      v.union(v.literal("clean"), v.literal("bold"), v.literal("minimal")),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(emailMutations.upsertEmailSettings, args as any);
    return null;
  },
});

export const setEmailDomain = mutation({
  args: {
    orgId: v.string(),
    domain: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(emailMutations.setEmailDomain, args as any);
    return null;
  },
});

export const enqueueTestEmail = mutation({
  args: {
    orgId: v.string(),
    to: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runMutation(emailMutations.enqueueTestEmail, args as any)) as any;
  },
});

