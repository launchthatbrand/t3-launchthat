import { v } from "convex/values";
import { mutation } from "../_generated/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

const readUserKey = async (ctx: any): Promise<string | null> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const tokenIdentifier =
    typeof identity.tokenIdentifier === "string" ? identity.tokenIdentifier.trim() : "";
  if (tokenIdentifier) return tokenIdentifier;
  const subject = typeof identity.subject === "string" ? identity.subject.trim() : "";
  return subject || null;
};

export const recordClick = mutation({
  args: {
    referralCode: v.string(),
    visitorId: v.string(),
    landingPath: v.optional(v.string()),
    referrer: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(componentsUntyped.launchthat_affiliates.tracking.recordClick, {
      referralCode: args.referralCode,
      visitorId: args.visitorId,
      landingPath: args.landingPath,
      referrer: args.referrer,
    });
    return null;
  },
});

/**
 * Called post-signup/login to attribute the current user to a captured `visitorId` / `referralCode`.
 * First-touch wins inside the affiliates component.
 */
export const attributeMySignup = mutation({
  args: {
    visitorId: v.optional(v.string()),
    referralCode: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const referredUserId = await readUserKey(ctx);
    if (!referredUserId) return null;
    return await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.tracking.attributeSignup,
      {
        referredUserId,
        visitorId: args.visitorId,
        referralCode: args.referralCode,
      },
    );
  },
});

/**
 * Mark the current user as activated (MVP: a separate client call can invoke this
 * after email verification).
 */
export const markMyActivated = mutation({
  args: { source: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const referredUserId = await readUserKey(ctx);
    if (!referredUserId) return null;
    return await ctx.runMutation(componentsUntyped.launchthat_affiliates.tracking.markActivated, {
      referredUserId,
      source: args.source === "manual" ? "manual" : "email_verified",
    });
  },
});

