import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  affiliateProfiles: defineTable({
    userId: v.string(),
    referralCode: v.string(),
    status: v.union(v.literal("active"), v.literal("disabled")),
    acceptedTermsAt: v.optional(v.number()),
    acceptedTermsVersion: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_referralCode", ["referralCode"]),

  affiliateLogs: defineTable({
    ts: v.number(),
    kind: v.string(),
    ownerUserId: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    referralCode: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    referredUserId: v.optional(v.string()),
    externalId: v.optional(v.string()),
    amountCents: v.optional(v.number()),
    currency: v.optional(v.string()),
  })
    .index("by_ts", ["ts"])
    .index("by_kind_and_ts", ["kind", "ts"])
    .index("by_ownerUserId_and_ts", ["ownerUserId", "ts"]),

  affiliateClicks: defineTable({
    referralCode: v.string(),
    visitorId: v.string(),
    clickedAt: v.number(),
    landingPath: v.optional(v.string()),
    referrer: v.optional(v.string()),
    uaHash: v.optional(v.string()),
    ipHash: v.optional(v.string()),
  })
    .index("by_referralCode_and_clickedAt", ["referralCode", "clickedAt"])
    .index("by_visitorId_and_clickedAt", ["visitorId", "clickedAt"]),

  affiliateAttributions: defineTable({
    referralCode: v.string(),
    referrerUserId: v.string(),
    referredUserId: v.string(),
    attributedAt: v.number(),
    expiresAt: v.number(),
    activatedAt: v.optional(v.number()),
    firstPaidConversionAt: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("consumed"),
      v.literal("expired"),
    ),
  })
    .index("by_referredUserId", ["referredUserId"])
    .index("by_referrerUserId_and_attributedAt", ["referrerUserId", "attributedAt"])
    .index("by_referralCode", ["referralCode"]),

  affiliateActivations: defineTable({
    referredUserId: v.string(),
    activatedAt: v.number(),
    source: v.union(v.literal("email_verified"), v.literal("manual")),
  }).index("by_referredUserId", ["referredUserId"]),

  affiliateConversions: defineTable({
    kind: v.union(v.literal("paid_subscription"), v.literal("paid_order")),
    externalId: v.string(),
    referredUserId: v.string(),
    referrerUserId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    occurredAt: v.number(),
  })
    .index("by_externalId_and_kind", ["externalId", "kind"])
    .index("by_occurredAt", ["occurredAt"])
    .index("by_referrerUserId_and_occurredAt", ["referrerUserId", "occurredAt"])
    .index("by_referredUserId", ["referredUserId"]),

  affiliateCreditEvents: defineTable({
    userId: v.string(),
    kind: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    reason: v.string(),
    externalEventId: v.string(),
    source: v.optional(v.string()),
    referrerUserId: v.optional(v.string()),
    referredUserId: v.optional(v.string()),
    conversionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_userId_and_reason", ["userId", "reason"])
    .index("by_userId_and_externalEventId", ["userId", "externalEventId"])
    .index("by_reason", ["reason"]),

  affiliateBenefits: defineTable({
    userId: v.string(),
    kind: v.union(v.literal("subscription_discount"), v.literal("feature_unlock")),
    value: v.any(),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("disabled")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_and_status", ["userId", "status"])
    .index("by_userId_and_kind", ["userId", "kind"]),

  affiliateProgramSettings: defineTable({
    scopeType: v.union(v.literal("site"), v.literal("org"), v.literal("app")),
    scopeId: v.string(),
    attributionWindowDays: v.number(),
    activationMilestones: v.any(),
    paidConversionDiscountRules: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_scope", ["scopeType", "scopeId"]),
});

