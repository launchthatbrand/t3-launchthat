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

