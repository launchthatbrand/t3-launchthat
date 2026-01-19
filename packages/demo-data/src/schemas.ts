import { z } from "zod";

export const tradingCalendarDailyStatSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  pnl: z.number(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
});

export const dashboardStatsSchema = z.object({
  balance: z.number(),
  monthlyReturn: z.number(),
  winRate: z.number(),
  profitFactor: z.number(),
  avgRiskReward: z.number(),
  streak: z.number().int().nonnegative(),
});

export const insightSchema = z.object({
  id: z.string(),
  kind: z.enum(["positive", "warning", "neutral"]),
  title: z.string(),
  description: z.string(),
  icon: z.enum(["trendingUp", "alertCircle", "calendar"]),
});

export const tradingPlanRuleSchema = z.object({
  id: z.string(),
  category: z.enum(["Entry", "Risk", "Exit", "Process", "Psychology"]),
  severity: z.enum(["hard", "soft"]),
  title: z.string(),
  description: z.string(),
});

export const tradingPlanSessionSchema = z.object({
  id: z.string(),
  label: z.string(),
  days: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])),
  start: z.string(), // e.g. "07:00"
  end: z.string(), // e.g. "11:00"
  timezone: z.string(), // e.g. "America/New_York"
});

export const tradingPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  createdAt: z.string(), // ISO date
  strategySummary: z.string(),
  markets: z.array(z.string()),
  sessions: z.array(tradingPlanSessionSchema),
  risk: z.object({
    maxRiskPerTradePct: z.number(),
    maxDailyLossPct: z.number(),
    maxWeeklyLossPct: z.number(),
    maxOpenPositions: z.number().int().positive(),
    maxTradesPerDay: z.number().int().positive(),
  }),
  rules: z.array(tradingPlanRuleSchema),
  kpis: z.object({
    adherencePct: z.number().min(0).max(100),
    journalCompliancePct: z.number().min(0).max(100),
    violations7d: z.number().int().nonnegative(),
    avgRiskPerTradePct7d: z.number().min(0).max(100),
    sessionDisciplinePct7d: z.number().min(0).max(100),
  }),
});

export const tradingPlanViolationSchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD
  ruleId: z.string(),
  ruleTitle: z.string(),
  severity: z.enum(["hard", "soft"]),
  tradeId: z.string().optional(),
  note: z.string().optional(),
});

export const reviewTradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  type: z.enum(["Long", "Short"]),
  date: z.string(),
  reason: z.string(),
  reviewed: z.boolean(),
  pnl: z.number(),
  tradeDate: z.string(), // YYYY-MM-DD
});

export const adminOrderSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  type: z.enum(["Buy", "Sell"]),
  qty: z.number(),
  price: z.number(),
  status: z.enum(["Filled", "Pending", "Cancelled", "Rejected"]),
  time: z.string(),
  date: z.string(),
  pnl: z.number().nullable(),
  // Optional link to a trade review item (e.g. demoReviewTrades[id])
  tradeId: z.string().optional(),
  // Optional metadata for display
  role: z.enum(["Entry", "Exit", "Stop", "TP"]).optional(),
});

export const notificationDetailsSchema = z.object({
  title: z.string(),
  summary: z.string(),
  howCalculated: z.string().optional(),
});

export const notificationRouteSchema = z.object({
  kind: z.enum(["tab", "signalDetail", "insight"]),
  tab: z.enum(["home", "signals", "journal", "settings"]).optional(),
  signalId: z.string().optional(),
  insightId: z.string().optional(),
});

export const phoneNotificationSchema = z.object({
  id: z.string(),
  app: z.string(),
  time: z.string(), // "now", "2m", etc. demo-friendly
  title: z.string(),
  body: z.string(),
  accent: z.boolean().optional(),
  details: notificationDetailsSchema,
  route: notificationRouteSchema.optional(),
});

export const publicProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarUrl: z.string().optional(),
  headline: z.string().optional(),
});

export const publicUserBadgeSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  tone: z.enum(["orange", "emerald", "sky", "violet", "slate"]).default("slate"),
});

export const publicUserLeaderboardRankSchema = z.object({
  id: z.string(),
  label: z.string(),
  rank: z.number().int().positive(),
  total: z.number().int().positive(),
});

export const publicUserTradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: z.enum(["Long", "Short"]),
  dateLabel: z.string(), // demo-friendly, e.g. "Today", "Yesterday"
  pnl: z.number(),
  rMultiple: z.number(),
  setup: z.string(),
});

export const publicUserProfileSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().optional(),
  bio: z.string(),
  isPublic: z.boolean(),
  primaryBroker: z.string(),
  reviewSettings: z
    .object({
      // Admin setting: can this user write reviews?
      canWriteReviews: z.boolean().optional(),
      // Admin setting: can this user's public profile receive reviews?
      allowProfileReviews: z.boolean().optional(),
    })
    .optional(),
  stats: z.object({
    balance: z.number(),
    winRate: z.number(),
    profitFactor: z.number(),
    avgRiskReward: z.number(),
    monthlyReturn: z.number(),
    streak: z.number().int().nonnegative(),
  }),
  badges: z.array(publicUserBadgeSchema),
  leaderboards: z.array(publicUserLeaderboardRankSchema),
  recentTrades: z.array(publicUserTradeSchema),
});

export const affiliateKindSchema = z.enum(["broker", "firm"]);

export const reviewTargetKindSchema = z.enum(["broker", "firm", "user"]);

export const reviewTargetSchema = z.union([
  z.object({ kind: z.literal("broker"), slug: z.string() }),
  z.object({ kind: z.literal("firm"), slug: z.string() }),
  z.object({ kind: z.literal("user"), username: z.string() }),
]);

export const demoReviewSchema = z.object({
  id: z.string(),
  target: reviewTargetSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(), // ISO date
  author: z.object({
    username: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().optional(),
  }),
});

export const affiliateLinkSchema = z.object({
  id: z.string(),
  kind: affiliateKindSchema,
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  affiliateUrl: z.string().url(),
  websiteUrl: z.string().url(),
  logoUrl: z.string().url().optional(),
  badges: z.array(z.string()).default([]),
  markets: z.array(z.string()).default([]),
  pricingNote: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
});

export const demoDataSchema = z.object({
  dashboard: z.object({
    stats: dashboardStatsSchema,
    calendarDailyStats: z.array(tradingCalendarDailyStatSchema),
    insights: z.array(insightSchema),
    reviewTrades: z.array(reviewTradeSchema),
  }),
  notifications: z.array(phoneNotificationSchema),
  affiliates: z
    .object({
      brokers: z.array(affiliateLinkSchema),
      firms: z.array(affiliateLinkSchema),
    })
    .optional(),
});

export type DemoData = z.infer<typeof demoDataSchema>;
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type TradingCalendarDailyStat = z.infer<typeof tradingCalendarDailyStatSchema>;
export type DemoInsight = z.infer<typeof insightSchema>;
export type DemoReviewTrade = z.infer<typeof reviewTradeSchema>;
export type DemoAdminOrder = z.infer<typeof adminOrderSchema>;
export type DemoPhoneNotification = z.infer<typeof phoneNotificationSchema>;
export type DemoPublicProfile = z.infer<typeof publicProfileSchema>;
export type DemoPublicUserProfile = z.infer<typeof publicUserProfileSchema>;
export type DemoPublicUserBadge = z.infer<typeof publicUserBadgeSchema>;
export type DemoPublicUserTrade = z.infer<typeof publicUserTradeSchema>;
export type DemoPublicUserLeaderboardRank = z.infer<
  typeof publicUserLeaderboardRankSchema
>;
export type DemoAffiliateKind = z.infer<typeof affiliateKindSchema>;
export type DemoAffiliateLink = z.infer<typeof affiliateLinkSchema>;
export type DemoReviewTargetKind = z.infer<typeof reviewTargetKindSchema>;
export type DemoReview = z.infer<typeof demoReviewSchema>;
export type DemoTradingPlan = z.infer<typeof tradingPlanSchema>;
export type DemoTradingPlanRule = z.infer<typeof tradingPlanRuleSchema>;
export type DemoTradingPlanSession = z.infer<typeof tradingPlanSessionSchema>;
export type DemoTradingPlanViolation = z.infer<typeof tradingPlanViolationSchema>;

