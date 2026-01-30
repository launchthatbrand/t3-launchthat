import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiUntyped: any = require("../_generated/api").api;
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

const stripClerkIssuerPrefix = (userKey: string): string => {
  const s = String(userKey ?? "").trim();
  const pipeIdx = s.indexOf("|");
  if (pipeIdx === -1) return s;
  const tail = s.slice(pipeIdx + 1).trim();
  return tail || s;
};

const resolveUserDisplayName = async (ctx: any, userKey: string): Promise<string> => {
  const normalized = String(userKey ?? "").trim();
  if (!normalized) return "User";
  const clerkId = stripClerkIssuerPrefix(normalized);

  // Prefer clerkId lookup.
  const byClerk = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first();
  const name1 = byClerk && typeof (byClerk as any).name === "string" ? String((byClerk as any).name).trim() : "";
  if (name1) return name1;

  // Fallback to tokenIdentifier lookup (for `issuer|user_x` keys).
  const byToken = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", normalized))
    .first();
  const name2 = byToken && typeof (byToken as any).name === "string" ? String((byToken as any).name).trim() : "";
  if (name2) return name2;

  return `User ${clerkId.slice(-6)}`;
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

export const getMyAffiliateDashboard = action({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      profile: v.union(
        v.null(),
        v.object({
          userId: v.string(),
          referralCode: v.string(),
          status: v.union(v.literal("active"), v.literal("disabled")),
        }),
      ),
      stats: v.object({
        userId: v.string(),
        referralCode: v.union(v.string(), v.null()),
        clicks30d: v.number(),
        signups30d: v.number(),
        activations30d: v.number(),
        conversions30d: v.number(),
        creditBalanceCents: v.number(),
      }),
      benefits: v.array(
        v.object({
          kind: v.string(),
          value: v.any(),
          startsAt: v.number(),
          endsAt: v.optional(v.number()),
          status: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const userId = await readUserKey(ctx);
    if (!userId) return null;

    const profileUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.profiles.getAffiliateProfileByUserId,
      { userId },
    );
    const profile = profileUnknown ?? null;

    const stats: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.profiles.getMyAffiliateStats,
      { userId },
    );

    const benefitsUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.rewards.queries.listActiveBenefitsForUser,
      { userId },
    );

    return {
      profile,
      stats,
      benefits: Array.isArray(benefitsUnknown) ? benefitsUnknown : [],
    };
  },
});

export const becomeAffiliate = mutation({
  args: {
    termsVersion: v.string(),
  },
  returns: v.object({
    userId: v.string(),
    referralCode: v.string(),
    status: v.union(v.literal("active"), v.literal("disabled")),
  }),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");
    const termsVersion = String(args.termsVersion ?? "").trim();
    if (!termsVersion) throw new Error("Missing termsVersion");

    const res: any = await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.profiles.createOrGetMyAffiliateProfile,
      {
        userId,
        acceptTerms: true,
        termsVersion,
      },
    );
    return res;
  },
});

export const getMySponsorLink = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      userId: v.string(),
      sponsorUserId: v.string(),
      createdAt: v.number(),
      createdSource: v.string(),
      updatedAt: v.optional(v.number()),
      updatedBy: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await readUserKey(ctx);
    if (!userId) return null;
    const res: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.network.queries.getSponsorLinkForUser,
      { userId },
    );
    return res ?? null;
  },
});

export const joinMySponsorNetwork = mutation({
  args: { referralCode: v.string() },
  returns: v.object({
    ok: v.boolean(),
    created: v.boolean(),
    sponsorUserId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");
    const referralCode = String(args.referralCode ?? "").trim();
    if (!referralCode) throw new Error("Missing referralCode");
    const res: any = await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.network.mutations.setMySponsorByReferralCodeOptIn,
      { userId, referralCode },
    );
    return res;
  },
});

export const listMyRecruits = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      referredUserId: v.string(),
      name: v.string(),
      attributedAt: v.number(),
      activatedAt: v.optional(v.number()),
      firstPaidConversionAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const referrerUserId = await readUserKey(ctx);
    if (!referrerUserId) throw new Error("Unauthorized");

    const limitRaw = typeof args.limit === "number" ? args.limit : 200;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));

    const rowsUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.referrals.queries.listMyReferredUsers,
      {
        referrerUserId,
        limit,
      },
    );
    const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];

    const out: Array<{
      referredUserId: string;
      name: string;
      attributedAt: number;
      activatedAt?: number;
      firstPaidConversionAt?: number;
    }> = [];

    for (const r of rows) {
      const referredUserId = String(r?.referredUserId ?? "").trim();
      if (!referredUserId) continue;
      const name = await resolveUserDisplayName(ctx as any, referredUserId);
      out.push({
        referredUserId,
        name,
        attributedAt: typeof r?.attributedAt === "number" ? Number(r.attributedAt) : 0,
        activatedAt: typeof r?.activatedAt === "number" ? Number(r.activatedAt) : undefined,
        firstPaidConversionAt:
          typeof r?.firstPaidConversionAt === "number"
            ? Number(r.firstPaidConversionAt)
            : undefined,
      });
    }

    return out;
  },
});

export const listMyDirectDownline = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      userId: v.string(),
      name: v.string(),
      joinedAt: v.number(),
      createdSource: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const sponsorUserId = await readUserKey(ctx);
    if (!sponsorUserId) throw new Error("Unauthorized");
    const limitRaw = typeof args.limit === "number" ? args.limit : 250;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));

    const rowsUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.network.queries.listDirectDownlineForSponsor,
      { sponsorUserId, limit },
    );
    const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];

    const out: Array<{ userId: string; name: string; joinedAt: number; createdSource: string }> = [];
    for (const r of rows) {
      const userId = String(r?.userId ?? "").trim();
      if (!userId) continue;
      out.push({
        userId,
        name: await resolveUserDisplayName(ctx as any, userId),
        joinedAt: typeof r?.createdAt === "number" ? Number(r.createdAt) : 0,
        createdSource: String(r?.createdSource ?? ""),
      });
    }
    return out;
  },
});

export const getMyTopLandingPaths = query({
  args: { daysBack: v.optional(v.number()), limit: v.optional(v.number()) },
  returns: v.object({
    userId: v.string(),
    referralCode: v.union(v.string(), v.null()),
    daysBack: v.number(),
    totalClicks: v.number(),
    topLandingPaths: v.array(v.object({ path: v.string(), clicks: v.number() })),
  }),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");
    const res: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.analytics.queries.getTopLandingPathsForUser,
      {
        userId,
        daysBack: typeof args.daysBack === "number" ? args.daysBack : undefined,
        limit: typeof args.limit === "number" ? args.limit : undefined,
      },
    );
    return res as any;
  },
});

const normalizeLandingPath = (raw: string): string => {
  const s = String(raw ?? "").trim();
  if (!s) return "/";
  if (!s.startsWith("/")) return "/";
  if (s.length > 1024) return "/";
  return s;
};

const buildSharePath = (args: {
  landingPath: string;
  referralCode: string;
  campaign: string;
  templateId: string;
}): string => {
  const base = new URL("http://example.local" + normalizeLandingPath(args.landingPath));
  base.searchParams.set("ref", String(args.referralCode ?? "").trim());
  base.searchParams.set("utm_source", "affiliate");
  base.searchParams.set("utm_medium", "share");
  base.searchParams.set("utm_campaign", String(args.campaign ?? "").trim() || "affiliate");
  base.searchParams.set("utm_content", String(args.templateId ?? "").trim() || "default");
  return base.pathname + base.search;
};

export const createMyAffiliateShareLink = mutation({
  args: {
    landingPath: v.string(),
    campaign: v.string(),
    templateId: v.string(),
  },
  returns: v.object({
    code: v.string(),
    url: v.optional(v.string()),
    path: v.string(),
    campaign: v.string(),
    templateId: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");

    const profile: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.profiles.getAffiliateProfileByUserId,
      { userId },
    );
    const referralCode =
      profile?.status === "active" && typeof profile?.referralCode === "string"
        ? String(profile.referralCode).trim()
        : "";
    if (!referralCode) throw new Error("Affiliate profile required");

    const landingPath = normalizeLandingPath(args.landingPath);
    const campaign = String(args.campaign ?? "").trim() || "affiliate";
    const templateId = String(args.templateId ?? "").trim() || "default";
    const path = buildSharePath({ landingPath, referralCode, campaign, templateId });

    const targetId = `affiliateShare:${userId}:${templateId}:${campaign}:${landingPath}`;
    const out: any = await ctx.runMutation(apiUntyped.shortlinks.mutations.createShortlink, {
      path,
      kind: "affiliate_share",
      targetId,
    });

    return {
      code: String(out?.code ?? ""),
      url: typeof out?.url === "string" ? out.url : undefined,
      path,
      campaign,
      templateId,
    };
  },
});

export const listMyAffiliateShareLinks = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      code: v.string(),
      url: v.optional(v.string()),
      path: v.string(),
      createdAt: v.number(),
      clickCount: v.optional(v.number()),
      lastAccessAt: v.optional(v.number()),
      campaign: v.string(),
      templateId: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");

    const limitRaw = typeof args.limit === "number" ? args.limit : 50;
    const limit = Math.max(1, Math.min(200, Math.floor(limitRaw)));

    const settings: any = await ctx.runQuery(apiUntyped.shortlinks.queries.getPublicShortlinkSettings, {});
    const domain = typeof settings?.domain === "string" ? settings.domain.trim() : "";

    const rowsUnknown: any = await ctx.runQuery(apiUntyped.shortlinks.queries.listMyShortlinksByKind, {
      kind: "affiliate_share",
      limit,
    });
    const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];

    const out: any[] = [];
    for (const r of rows) {
      const code = String(r?.code ?? "").trim();
      const path = String(r?.path ?? "").trim();
      const createdAt = typeof r?.createdAt === "number" ? Number(r.createdAt) : 0;
      const clickCount = typeof r?.clickCount === "number" ? Number(r.clickCount) : undefined;
      const lastAccessAt = typeof r?.lastAccessAt === "number" ? Number(r.lastAccessAt) : undefined;
      if (!code || !path) continue;

      // Parse metadata from the stored path.
      const u = new URL("http://example.local" + path);
      const campaign = u.searchParams.get("utm_campaign") ?? "affiliate";
      const templateId = u.searchParams.get("utm_content") ?? "default";

      out.push({
        code,
        url: domain ? `https://${domain}/s/${code}` : undefined,
        path,
        createdAt,
        clickCount,
        lastAccessAt,
        campaign,
        templateId,
      });
    }

    return out;
  },
});

export const listMyCreditEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      kind: v.optional(v.string()),
      amountCents: v.number(),
      currency: v.string(),
      reason: v.string(),
      externalEventId: v.optional(v.string()),
      createdAt: v.number(),
      referredUserId: v.optional(v.string()),
      referrerUserId: v.optional(v.string()),
      conversionId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");

    const limitRaw = typeof args.limit === "number" ? args.limit : 200;
    const limit = Math.max(1, Math.min(2000, Math.floor(limitRaw)));

    const rowsUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateCreditEventsForUser,
      { userId, limit },
    );
    return Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];
  },
});

const STRIPE_SECRET_KEY_ENV = "STRIPE_SECRET_KEY";

const readStripeSecretKey = (): string => {
  const key = typeof process.env[STRIPE_SECRET_KEY_ENV] === "string" ? String(process.env[STRIPE_SECRET_KEY_ENV]) : "";
  const trimmed = key.trim();
  if (!trimmed) {
    throw new Error(`Missing ${STRIPE_SECRET_KEY_ENV} env var`);
  }
  return trimmed;
};

export const getMyAffiliatePayoutSettings = action({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    userId: v.union(v.string(), v.null()),
    payoutAccount: v.union(
      v.null(),
      v.object({
        userId: v.string(),
        provider: v.string(),
        connectAccountId: v.string(),
        status: v.string(),
      }),
    ),
    payoutPreference: v.union(
      v.null(),
      v.object({
        userId: v.string(),
        policy: v.string(),
        currency: v.string(),
        minPayoutCents: v.number(),
      }),
    ),
    creditBalanceCents: v.number(),
    upcomingSubscriptionDueCents: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await readUserKey(ctx);
    if (!userId) {
      return {
        ok: true,
        userId: null,
        payoutAccount: null,
        payoutPreference: null,
        creditBalanceCents: 0,
        upcomingSubscriptionDueCents: 0,
      };
    }

    const payoutAccountUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_ecommerce.payouts.queries.getPayoutAccount,
      { userId, provider: "stripe" },
    );
    const payoutAccount =
      payoutAccountUnknown && typeof payoutAccountUnknown === "object"
        ? {
            userId: String(payoutAccountUnknown.userId ?? ""),
            provider: String(payoutAccountUnknown.provider ?? ""),
            connectAccountId: String(payoutAccountUnknown.connectAccountId ?? ""),
            status: String(payoutAccountUnknown.status ?? ""),
          }
        : null;

    const payoutPreferenceUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_ecommerce.payouts.queries.getPayoutPreference,
      { userId },
    );
    const payoutPreference =
      payoutPreferenceUnknown && typeof payoutPreferenceUnknown === "object"
        ? {
            userId: String(payoutPreferenceUnknown.userId ?? ""),
            policy: String(payoutPreferenceUnknown.policy ?? "payout_only"),
            currency: String(payoutPreferenceUnknown.currency ?? "USD").toUpperCase(),
            minPayoutCents:
              typeof payoutPreferenceUnknown.minPayoutCents === "number"
                ? Number(payoutPreferenceUnknown.minPayoutCents)
                : 0,
          }
        : null;

    const balUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.credit.queries.getCreditBalance,
      { userId, currency: "USD" },
    );
    const creditBalanceCents =
      typeof balUnknown?.balanceCents === "number" ? Number(balUnknown.balanceCents) : 0;

    let upcomingSubscriptionDueCents = 0;
    try {
      const stripeSecretKey = readStripeSecretKey();
      const dueUnknown: any = await ctx.runAction(
          componentsUntyped.launchthat_ecommerce.payouts.actions.getUpcomingSubscriptionDueCentsForUser,
          { stripeSecretKey, userId, currency: "USD" },
      );
      upcomingSubscriptionDueCents =
        typeof dueUnknown?.dueCents === "number" ? Number(dueUnknown.dueCents) : 0;
    } catch {
      upcomingSubscriptionDueCents = 0;
    }

    return {
      ok: true,
      userId,
      payoutAccount,
      payoutPreference,
      creditBalanceCents,
      upcomingSubscriptionDueCents,
    };
  },
});

export const setMyAffiliatePayoutPreference = mutation({
  args: {
    policy: v.union(v.literal("payout_only"), v.literal("apply_to_subscription_then_payout")),
    minPayoutCents: v.optional(v.number()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.runMutation(componentsUntyped.launchthat_ecommerce.payouts.mutations.setPayoutPreference, {
      userId,
      policy: args.policy,
      currency: "USD",
      minPayoutCents: typeof args.minPayoutCents === "number" ? args.minPayoutCents : 0,
    });
    return { ok: true };
  },
});

export const createMyAffiliatePayoutOnboardingLink = action({
  args: {
    refreshUrl: v.string(),
    returnUrl: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");
    const stripeSecretKey = readStripeSecretKey();

    // Best-effort: prefill Stripe onboarding using the app-owned `users` table.
    const viewerUnknown: any = await ctx.runQuery(apiUntyped.viewer.queries.getViewerProfile, {});
    const email = viewerUnknown && typeof viewerUnknown.email === "string" ? String(viewerUnknown.email).trim() : undefined;
    const fullName =
      viewerUnknown && typeof viewerUnknown.name === "string" ? String(viewerUnknown.name).trim() : undefined;

    let websiteUrl: string | undefined;
    try {
      const origin = new URL(String(args.returnUrl ?? "")).origin;
      const parsed = new URL(origin);
      const protocolOk = parsed.protocol === "https:" || parsed.protocol === "http:";
      const host = parsed.hostname.toLowerCase();
      const looksPublic =
        host !== "localhost" &&
        host !== "127.0.0.1" &&
        host !== "::1" &&
        // crude but effective: require a dot to avoid "localhost"
        host.includes(".");
      websiteUrl = protocolOk && looksPublic ? parsed.origin : undefined;
    } catch {
      websiteUrl = undefined;
    }

    const productDescription =
      "Affiliate marketing and referral commissions for TraderLaunchpad subscriptions.";

    const link: any = await ctx.runAction(
      componentsUntyped.launchthat_ecommerce.payouts.actions.createStripeConnectOnboardingLinkForUser,
      {
        stripeSecretKey,
        userId,
        refreshUrl: String(args.refreshUrl ?? ""),
        returnUrl: String(args.returnUrl ?? ""),
        email,
        fullName,
        businessType: "individual",
        productDescription,
        websiteUrl,
        supportEmail: email,
        metadata: { app: "traderlaunchpad" },
      },
    );
    const url = String(link?.url ?? "").trim();
    if (!url) throw new Error("Failed to create onboarding link");
    return { ok: true, url };
  },
});

export const disconnectMyAffiliatePayoutAccount = action({
  args: {
    deleteRemote: v.optional(v.boolean()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");
    const stripeSecretKey = readStripeSecretKey();

    await ctx.runAction(componentsUntyped.launchthat_ecommerce.payouts.actions.disconnectStripePayoutAccountForUser, {
      stripeSecretKey,
      userId,
      deleteRemote: args.deleteRemote !== false,
    });
    return { ok: true };
  },
});

