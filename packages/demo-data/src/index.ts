import type {
  DashboardStats,
  DemoAdminOrder,
  DemoAffiliateLink,
  DemoData,
  DemoInsight,
  DemoPhoneNotification,
  DemoPublicProfile,
  DemoPublicUserProfile,
  DemoTradingPlan,
  DemoTradingPlanViolation,
  DemoReview,
  DemoReviewTrade,
  TradingCalendarDailyStat,
} from "./schemas";

import { demoDataSchema } from "./schemas";

export type {
  DashboardStats,
  DemoAdminOrder,
  DemoData,
  DemoAffiliateLink,
  DemoInsight,
  DemoPhoneNotification,
  DemoPublicProfile,
  DemoPublicUserProfile,
  DemoTradingPlan,
  DemoTradingPlanViolation,
  DemoReview,
  DemoReviewTrade,
  TradingCalendarDailyStat,
};
export * from "./schemas";

export const demoDashboardStats: DashboardStats = {
  balance: 12450.0,
  monthlyReturn: 12.5,
  winRate: 68,
  profitFactor: 2.4,
  avgRiskReward: 1.8,
  streak: 5,
};

export const demoCalendarDailyStats: TradingCalendarDailyStat[] = [
  { date: "2026-01-12", pnl: 320, wins: 2, losses: 0 },
  { date: "2026-01-13", pnl: -140, wins: 0, losses: 1 },
  { date: "2026-01-14", pnl: 420, wins: 3, losses: 1 },
  { date: "2026-01-15", pnl: 90, wins: 1, losses: 0 },
  { date: "2026-01-16", pnl: -60, wins: 1, losses: 2 },
  { date: "2026-01-17", pnl: 780, wins: 3, losses: 0 },
];

export const demoInsights: DemoInsight[] = [
  {
    id: "insight-1",
    kind: "positive",
    title: "On Fire",
    description: "Your win rate on 'Breakout' setups is 80% this week.",
    icon: "trendingUp",
  },
  {
    id: "insight-2",
    kind: "warning",
    title: "Oversizing Warning",
    description: "You risked >2% on your last 3 losing trades.",
    icon: "alertCircle",
  },
  {
    id: "insight-3",
    kind: "neutral",
    title: "Consistency",
    description: "You've journaled 100% of your trades for 5 days straight.",
    icon: "calendar",
  },
];

export const demoTradingPlan: DemoTradingPlan = {
  id: "tp-001",
  name: "Momentum Breakout + Retest (A-Setups Only)",
  version: "v1.0",
  createdAt: "2026-01-01T00:00:00.000Z",
  strategySummary:
    "Trade only A setups: breakout + retest in-direction of HTF bias. No chasing. One clean entry, defined invalidation, and pre-planned exits.",
  markets: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "NAS100"],
  sessions: [
    {
      id: "session-london",
      label: "London",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "02:00",
      end: "05:30",
      timezone: "America/New_York",
    },
    {
      id: "session-ny-open",
      label: "NY Open",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "09:00",
      end: "11:00",
      timezone: "America/New_York",
    },
  ],
  risk: {
    maxRiskPerTradePct: 1.0,
    maxDailyLossPct: 2.0,
    maxWeeklyLossPct: 5.0,
    maxOpenPositions: 2,
    maxTradesPerDay: 3,
  },
  rules: [
    {
      id: "r-entry-1",
      category: "Entry",
      severity: "hard",
      title: "Only A setups",
      description:
        "Enter only if checklist is complete (HTF bias aligned, breakout + retest, clear invalidation).",
    },
    {
      id: "r-risk-1",
      category: "Risk",
      severity: "hard",
      title: "Max 1% risk per trade",
      description: "Never exceed 1.0% risk per trade. If unsure, size down.",
    },
    {
      id: "r-risk-2",
      category: "Risk",
      severity: "hard",
      title: "Stop after max daily loss",
      description:
        "If daily P/L hits -2% or 2 losses in a row, stop trading for the day.",
    },
    {
      id: "r-process-1",
      category: "Process",
      severity: "soft",
      title: "Journal within 30 minutes",
      description:
        "Review and journal each trade within 30 minutes of exit (tag setup, emotions, screenshots).",
    },
    {
      id: "r-psych-1",
      category: "Psychology",
      severity: "soft",
      title: "No revenge trades",
      description:
        "After a loss, wait 10 minutes and re-run checklist before taking another position.",
    },
  ],
  kpis: {
    adherencePct: 84,
    journalCompliancePct: 92,
    violations7d: 2,
    avgRiskPerTradePct7d: 0.78,
    sessionDisciplinePct7d: 88,
  },
};

export const demoTradingPlanViolations: DemoTradingPlanViolation[] = [
  {
    id: "tpv-001",
    date: "2026-01-13",
    ruleId: "r-psych-1",
    ruleTitle: "No revenge trades",
    severity: "soft",
    tradeId: "3",
    note: "Took a second entry immediately after a stop-out.",
  },
  {
    id: "tpv-002",
    date: "2026-01-16",
    ruleId: "r-process-1",
    ruleTitle: "Journal within 30 minutes",
    severity: "soft",
    tradeId: "11",
    note: "Journaled at end of day instead of right after the session.",
  },
];

export const demoReviewTrades: DemoReviewTrade[] = [
  {
    id: "1",
    symbol: "EURUSD",
    type: "Long",
    date: "Jan 12",
    reason: "Clean breakout retest",
    reviewed: true,
    pnl: 180,
    tradeDate: "2026-01-12",
  },
  {
    id: "2",
    symbol: "GBPUSD",
    type: "Long",
    date: "Jan 12",
    reason: "Trend continuation",
    reviewed: true,
    pnl: 140,
    tradeDate: "2026-01-12",
  },
  {
    id: "3",
    symbol: "XAUUSD",
    type: "Short",
    date: "Jan 13",
    reason: "Late entry into demand",
    reviewed: false,
    pnl: -140,
    tradeDate: "2026-01-13",
  },
  {
    id: "4",
    symbol: "AAPL",
    type: "Long",
    date: "Jan 14",
    reason: "Opening range breakout",
    reviewed: true,
    pnl: 170,
    tradeDate: "2026-01-14",
  },
  {
    id: "5",
    symbol: "TSLA",
    type: "Long",
    date: "Jan 14",
    reason: "Momentum continuation",
    reviewed: true,
    pnl: 150,
    tradeDate: "2026-01-14",
  },
  {
    id: "6",
    symbol: "NAS100",
    type: "Long",
    date: "Jan 14",
    reason: "Pullback to VWAP",
    reviewed: false,
    pnl: 120,
    tradeDate: "2026-01-14",
  },
  {
    id: "7",
    symbol: "SPY",
    type: "Short",
    date: "Jan 14",
    reason: "Stopped on reversal",
    reviewed: true,
    pnl: -20,
    tradeDate: "2026-01-14",
  },
  {
    id: "8",
    symbol: "XAUUSD",
    type: "Long",
    date: "Jan 15",
    reason: "Support bounce",
    reviewed: true,
    pnl: 90,
    tradeDate: "2026-01-15",
  },
  {
    id: "9",
    symbol: "EURUSD",
    type: "Long",
    date: "Jan 16",
    reason: "Great entry",
    reviewed: false,
    pnl: 120,
    tradeDate: "2026-01-16",
  },
  {
    id: "10",
    symbol: "AAPL",
    type: "Short",
    date: "Jan 16",
    reason: "Impulse entry?",
    reviewed: false,
    pnl: -80,
    tradeDate: "2026-01-16",
  },
  {
    id: "11",
    symbol: "USDJPY",
    type: "Short",
    date: "Jan 16",
    reason: "Chop / no edge",
    reviewed: true,
    pnl: -100,
    tradeDate: "2026-01-16",
  },
  {
    id: "12",
    symbol: "BTCUSD",
    type: "Long",
    date: "Jan 17",
    reason: "Breakout + continuation",
    reviewed: true,
    pnl: 260,
    tradeDate: "2026-01-17",
  },
  {
    id: "13",
    symbol: "ETHUSD",
    type: "Long",
    date: "Jan 17",
    reason: "Higher low confirmation",
    reviewed: true,
    pnl: 280,
    tradeDate: "2026-01-17",
  },
  {
    id: "14",
    symbol: "NAS100",
    type: "Long",
    date: "Jan 17",
    reason: "Trend day follow-through",
    reviewed: false,
    pnl: 240,
    tradeDate: "2026-01-17",
  },
];

// Admin: Orders (single source of truth for /admin/orders, and used to compose trades).
export const demoAdminOrders: DemoAdminOrder[] = [
  // Trade 1 (EURUSD Long): entry + stop + take profit (close)
  {
    id: "mock-ord-001",
    symbol: "EURUSD",
    type: "Buy",
    qty: 1.0,
    price: 1.085,
    status: "Filled",
    time: "10:30 AM",
    date: "Jan 12",
    pnl: null,
    tradeId: "1",
    role: "Entry",
  },
  {
    id: "mock-ord-007",
    symbol: "EURUSD",
    type: "Sell",
    qty: 1.0,
    price: 1.0832,
    status: "Filled",
    time: "10:31 AM",
    date: "Jan 12",
    pnl: null,
    tradeId: "1",
    role: "Stop",
  },
  {
    id: "mock-ord-008",
    symbol: "EURUSD",
    type: "Sell",
    qty: 1.0,
    price: 1.0868,
    status: "Filled",
    time: "11:18 AM",
    date: "Jan 12",
    pnl: 180.0,
    tradeId: "1",
    role: "Exit",
  },

  // Other orders (not yet linked to a trade group)
  {
    id: "mock-ord-002",
    symbol: "NAS100",
    type: "Sell",
    qty: 0.5,
    price: 16850.0,
    status: "Filled",
    time: "09:45 AM",
    date: "Jan 16",
    pnl: 450.0,
  },
  {
    id: "mock-ord-003",
    symbol: "US30",
    type: "Buy",
    qty: 2.0,
    price: 37500.0,
    status: "Cancelled",
    time: "09:30 AM",
    date: "Jan 16",
    pnl: null,
  },
  {
    id: "mock-ord-004",
    symbol: "XAUUSD",
    type: "Sell",
    qty: 0.1,
    price: 2045.5,
    status: "Filled",
    time: "02:15 PM",
    date: "Jan 15",
    pnl: -50.0,
  },
  {
    id: "mock-ord-005",
    symbol: "GBPUSD",
    type: "Buy",
    qty: 1.5,
    price: 1.268,
    status: "Filled",
    time: "01:00 PM",
    date: "Jan 15",
    pnl: 120.0,
  },
  {
    id: "mock-ord-006",
    symbol: "BTCUSD",
    type: "Buy",
    qty: 0.05,
    price: 42500.0,
    status: "Filled",
    time: "11:20 AM",
    date: "Jan 14",
    pnl: 890.0,
  },
];

export const demoNotifications: DemoPhoneNotification[] = [
  {
    id: "best-time",
    app: "TraderLaunchpad",
    time: "now",
    title: "Best time to trade in 10 minutes",
    body: "Volatility window opening • Setup aligns with your edge",
    accent: true,
    details: {
      title: "Best time to trade in 10 minutes",
      summary:
        "We detected a high-probability window based on your preferred session, recent volatility, and historical performance for this setup.",
      howCalculated:
        "This alert blends: (1) session timing (your configured market hours), (2) recent volatility expansion vs. baseline, (3) trend + momentum alignment, and (4) your strategy’s historical win-rate at similar market conditions. The '10 minutes' estimate comes from the average time-to-breakout after a comparable compression pattern.",
    },
    route: { kind: "insight", insightId: "best-time" },
  },
  {
    id: "plan-violation",
    app: "TraderLaunchpad",
    time: "now",
    title: "Violating Trading Plan",
    body: "Entry blocked • You’re outside your trading window",
    accent: true,
    details: {
      title: "Trading plan violation",
      summary:
        "You attempted an entry outside your allowed time window. We blocked the trade to protect your rules and consistency.",
      howCalculated:
        "We compare your attempted entry time to your active plan’s 'Entry window' rule. If the attempt falls outside the allowed window (or after your daily stop / max trades), we flag it as a violation and recommend stepping away for 10 minutes.",
    },
    route: { kind: "tab", tab: "home" },
  },
  {
    id: "sync",
    app: "TradeLocker",
    time: "1m",
    title: "Sync complete",
    body: "Orders matched • Positions reconciled",
    details: {
      title: "TradeLocker sync complete",
      summary:
        "Your account snapshot and open positions were successfully synchronized.",
    },
    route: { kind: "tab", tab: "settings" },
  },
  {
    id: "discord",
    app: "Discord",
    time: "2m",
    title: "Alert sent",
    body: "Posted to #signals • 2.1k viewers reached",
    details: {
      title: "Discord alert sent",
      summary:
        "A formatted signal notification was delivered to your configured Discord channel.",
    },
    route: { kind: "tab", tab: "signals" },
  },
  {
    id: "backtest",
    app: "Backtester",
    time: "3m",
    title: "Report ready",
    body: "Win rate + expectancy calculated • Export available",
    details: {
      title: "Backtest report ready",
      summary:
        "We finished running the strategy across your selected time range and compiled a summary report.",
    },
    route: { kind: "tab", tab: "journal" },
  },
  {
    id: "risk",
    app: "Risk Engine",
    time: "now",
    title: "Guard active",
    body: "Drawdown protected • Exposure within limits",
    accent: true,
    details: {
      title: "Risk guard active",
      summary:
        "Your risk rules are currently enforcing exposure limits and drawdown protection.",
    },
    route: { kind: "tab", tab: "home" },
  },
  {
    id: "webhook",
    app: "Webhooks",
    time: "4m",
    title: "Delivered",
    body: "Latency 184ms • Subscriber acknowledged",
    details: {
      title: "Webhook delivered",
      summary:
        "The outbound webhook was delivered successfully and acknowledged by the subscriber endpoint.",
    },
    route: { kind: "tab", tab: "settings" },
  },
];

export const demoPublicProfiles: DemoPublicProfile[] = [
  {
    id: "u-1",
    username: "nova_trader",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=nova_trader",
    headline: "Breakout specialist • 5-day streak",
  },
  {
    id: "u-2",
    username: "kairo.fx",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=kairo.fx",
    headline: "Trend pullback plan • London session",
  },
  {
    id: "u-2b",
    username: "kairos.fx",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=kairos.fx",
    headline: "Trend pullback plan • London session",
  },
  {
    id: "u-3",
    username: "mira.daytrade",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=mira.daytrade",
    headline: "ORB (15m) • rules-first",
  },
  {
    id: "u-4",
    username: "solstice_ryan",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=solstice_ryan",
    headline: "Risk guard on • max 2 trades/day",
  },
  {
    id: "u-5",
    username: "zenith.algo",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=zenith.algo",
    headline: "News fades • tight stops",
  },
  {
    id: "u-6",
    username: "ari_signals",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=ari_signals",
    headline: "Discord alerts • journaling daily",
  },
  {
    id: "u-7",
    username: "pixelpips",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=pixelpips",
    headline: "Edge days mapped • Tues/Thurs",
  },
  {
    id: "u-8",
    username: "chris.nyopen",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=chris.nyopen",
    headline: "NY open • stop after -1R",
  },
  {
    id: "u-9",
    username: "luna_scalper",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=luna_scalper",
    headline: "Scalp plan • consistency focus",
  },
  {
    id: "u-10",
    username: "vault.victor",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=vault.victor",
    headline: "Profit factor up • fewer trades",
  },
  {
    id: "u-11",
    username: "orion_futures",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=orion_futures",
    headline: "Futures ladder • calm execution",
  },
  {
    id: "u-12",
    username: "hazel.quant",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=hazel.quant",
    headline: "Systematized entries • journaling weekly",
  },
  {
    id: "u-13",
    username: "delta_disciplined",
    avatarUrl:
      "https://api.dicebear.com/9.x/thumbs/svg?seed=delta_disciplined",
    headline: "Rules > vibes • max loss enforced",
  },
  {
    id: "u-14",
    username: "ember_edge",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=ember_edge",
    headline: "Edge days + execution windows",
  },
  {
    id: "u-15",
    username: "atlas_setups",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=atlas_setups",
    headline: "Setup library • weekly review",
  },
];

const logo = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;

const hashStringForDemo = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const defaultTradeLabels = ["Today", "Yesterday", "2d ago", "3d ago"] as const;

const makeRecentTradesForUser = (username: string, minTrades = 2) => {
  const h = hashStringForDemo(username.toLowerCase());
  const count = Math.max(minTrades, 2);
  const trades: DemoPublicUserProfile["recentTrades"] = [];
  for (let i = 0; i < count; i++) {
    const base = demoReviewTrades[(h + i) % demoReviewTrades.length]!;
    const pnlJitter = ((h >> (i * 3)) % 61) - 30; // -30..30
    const pnl = base.pnl + pnlJitter;
    const rMultiple = Math.round((pnl / 150) * 10) / 10;
    trades.push({
      id: `t-${base.id}-${username.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i + 1}`,
      symbol: base.symbol,
      side: base.type,
      dateLabel: defaultTradeLabels[i % defaultTradeLabels.length] ?? "Today",
      pnl,
      rMultiple,
      setup: base.reason,
    });
  }
  return trades;
};

const ensureUserHasBadgeLeaderboards = (
  u: DemoPublicUserProfile,
): DemoPublicUserProfile => {
  const badges = u.badges ?? [];
  const leaderboards = u.leaderboards ?? [];
  if (badges.length === 0) return u;

  const total = 2413;
  const existingIds = new Set(leaderboards.map((lb) => lb.id));
  const generated = badges
    .filter((b) => !existingIds.has(`lb-${b.id}`))
    .map((b) => {
      const h = hashStringForDemo(`${u.username.toLowerCase()}:${b.id}`);
      const rank = (h % total) + 1;
      return {
        id: `lb-${b.id}`,
        label: b.label,
        rank,
        total,
      };
    });

  return {
    ...u,
    leaderboards: leaderboards.concat(generated),
  };
};

const recomputeBadgeLeaderboardRanks = (
  users: DemoPublicUserProfile[],
): DemoPublicUserProfile[] => {
  const badgeIds = Array.from(
    new Set(
      users.flatMap((u) => (u.badges ?? []).map((b) => b.id)),
    ),
  );

  const updatedByUsername = new Map<string, DemoPublicUserProfile>(
    users.map((u) => [u.username, u]),
  );

  const compareForBadge = (badgeId: string, a: DemoPublicUserProfile, b: DemoPublicUserProfile) => {
    // Higher score should come first; we'll invert for ascending comparator.
    const cmp = (x: number, y: number) => (x === y ? 0 : x > y ? -1 : 1);
    switch (badgeId) {
      case "b-overlap": {
        const byWinRate = cmp(a.stats.winRate, b.stats.winRate);
        if (byWinRate !== 0) return byWinRate;
        const byMonthly = cmp(a.stats.monthlyReturn, b.stats.monthlyReturn);
        if (byMonthly !== 0) return byMonthly;
        return a.username.localeCompare(b.username);
      }
      case "b-review": {
        // We currently use stats.streak as the "review streak" stand-in.
        const byReviews = cmp(a.stats.streak, b.stats.streak);
        if (byReviews !== 0) return byReviews;
        return a.username.localeCompare(b.username);
      }
      default: {
        // Deterministic fallback: higher hash wins, then username.
        const ha = hashStringForDemo(`${a.username.toLowerCase()}:${badgeId}`);
        const hb = hashStringForDemo(`${b.username.toLowerCase()}:${badgeId}`);
        const byHash = cmp(ha, hb);
        if (byHash !== 0) return byHash;
        return a.username.localeCompare(b.username);
      }
    }
  };

  for (const badgeId of badgeIds) {
    const holders = users.filter((u) => (u.badges ?? []).some((b) => b.id === badgeId));
    if (holders.length === 0) continue;

    const total = holders.length;
    const sorted = holders.slice().sort((a, b) => compareForBadge(badgeId, a, b));

    for (let i = 0; i < sorted.length; i++) {
      const u = sorted[i];
      if (!u) continue;
      const rank = i + 1;
      const badge = (u.badges ?? []).find((b) => b.id === badgeId);
      const label = badge?.label ?? badgeId;
      const entryId = `lb-${badgeId}`;

      const current = updatedByUsername.get(u.username);
      if (!current) continue;

      const existing = current.leaderboards ?? [];
      const nextLeaderboards = existing.some((lb) => lb.id === entryId)
        ? existing.map((lb) =>
            lb.id === entryId ? { ...lb, label, rank, total } : lb,
          )
        : existing.concat({ id: entryId, label, rank, total });

      updatedByUsername.set(u.username, { ...current, leaderboards: nextLeaderboards });
    }
  }

  return users.map((u) => updatedByUsername.get(u.username) ?? u);
};

const recomputeStandardLeaderboards = (
  users: DemoPublicUserProfile[],
): DemoPublicUserProfile[] => {
  const defs: Array<{
    id: string;
    label: string;
    compare: (a: DemoPublicUserProfile, b: DemoPublicUserProfile) => number;
  }> = [
    {
      id: "lb-edge",
      label: "Edge days",
      compare: (a, b) => {
        if (a.stats.streak !== b.stats.streak) return b.stats.streak - a.stats.streak;
        if (a.stats.winRate !== b.stats.winRate) return b.stats.winRate - a.stats.winRate;
        if (a.stats.monthlyReturn !== b.stats.monthlyReturn) return b.stats.monthlyReturn - a.stats.monthlyReturn;
        return a.username.localeCompare(b.username);
      },
    },
    {
      id: "lb-discipline",
      label: "Discipline",
      compare: (a, b) => {
        if (a.stats.profitFactor !== b.stats.profitFactor) return b.stats.profitFactor - a.stats.profitFactor;
        if (a.stats.winRate !== b.stats.winRate) return b.stats.winRate - a.stats.winRate;
        return a.username.localeCompare(b.username);
      },
    },
  ];

  const updatedByUsername = new Map<string, DemoPublicUserProfile>(
    users.map((u) => [u.username, u]),
  );

  for (const def of defs) {
    const sorted = users.slice().sort(def.compare);
    const total = sorted.length;

    for (let i = 0; i < sorted.length; i++) {
      const u = sorted[i];
      if (!u) continue;

      const rank = i + 1;
      const current = updatedByUsername.get(u.username);
      if (!current) continue;

      const existing = current.leaderboards ?? [];
      const next = existing.some((lb) => lb.id === def.id)
        ? existing.map((lb) =>
            lb.id === def.id ? { ...lb, label: def.label, rank, total } : lb,
          )
        : existing.concat({ id: def.id, label: def.label, rank, total });

      updatedByUsername.set(u.username, { ...current, leaderboards: next });
    }
  }

  return users.map((u) => updatedByUsername.get(u.username) ?? u);
};

const ensureUserHasTrades = (u: DemoPublicUserProfile): DemoPublicUserProfile => {
  const existing = u.recentTrades ?? [];
  if (existing.length >= 2) return u;
  return {
    ...u,
    recentTrades: makeRecentTradesForUser(u.username, 2),
  };
};

const demoPublicUsersBase: DemoPublicUserProfile[] = [
  {
    username: "nova_trader",
    displayName: "Nova Trader",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=nova_trader",
    bio: "NY open breakouts, strict risk rules, and daily review. Building consistency one session at a time.",
    isPublic: true,
    primaryBroker: "TradeLocker",
    stats: {
      balance: 12450,
      winRate: 68,
      profitFactor: 2.4,
      avgRiskReward: 1.8,
      monthlyReturn: 12.5,
      streak: 5,
    },
    badges: [
      {
        id: "b-streak",
        label: "5-day streak",
        description: "Logged trades 5 days in a row.",
        tone: "orange",
      },
      {
        id: "b-risk",
        label: "Risk guard enabled",
        description: "Never exceeded max loss for 30 sessions.",
        tone: "emerald",
      },
      {
        id: "b-journal",
        label: "Journaled 100%",
        description: "All trades have notes + screenshots.",
        tone: "sky",
      },
    ],
    leaderboards: [
      { id: "lb-consistency", label: "Consistency", rank: 12, total: 2413 },
      { id: "lb-profitfactor", label: "Profit factor", rank: 34, total: 2413 },
      { id: "lb-winrate", label: "Win rate", rank: 61, total: 2413 },
    ],
    recentTrades: [
      {
        id: "t-1",
        symbol: "EURUSD",
        side: "Long",
        dateLabel: "Today",
        pnl: 240,
        rMultiple: 1.6,
        setup: "NY Open Breakout",
      },
      {
        id: "t-2",
        symbol: "XAUUSD",
        side: "Long",
        dateLabel: "Yesterday",
        pnl: 120,
        rMultiple: 1.2,
        setup: "Trend Pullback",
      },
      {
        id: "t-3",
        symbol: "AAPL",
        side: "Short",
        dateLabel: "Yesterday",
        pnl: -90,
        rMultiple: -0.6,
        setup: "News Fade",
      },
    ],
  },
  {
    username: "kairos.fx",
    displayName: "Kairos FX",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=kairos.fx",
    bio: "Trend pullbacks in London + NY overlap. Focus: fewer trades, higher quality.",
    isPublic: true,
    primaryBroker: "MetaTrader Broker",
    reviewSettings: { canWriteReviews: true, allowProfileReviews: true },
    stats: {
      balance: 8420,
      winRate: 61,
      profitFactor: 1.9,
      avgRiskReward: 1.5,
      monthlyReturn: 8.2,
      streak: 3,
    },
    badges: [
      { id: "b-overlap", label: "Session specialist", tone: "violet" },
      { id: "b-review", label: "Weekly review", tone: "sky" },
    ],
    leaderboards: [
      { id: "lb-edge", label: "Edge days", rank: 44, total: 2413 },
      { id: "lb-discipline", label: "Discipline", rank: 28, total: 2413 },
    ],
    recentTrades: [
      {
        id: "t-4-kairos",
        symbol: "GBPUSD",
        side: "Short",
        dateLabel: "Today",
        pnl: 180,
        rMultiple: 1.3,
        setup: "Trend Pullback",
      },
      {
        id: "t-5-kairos",
        symbol: "EURUSD",
        side: "Long",
        dateLabel: "2d ago",
        pnl: -70,
        rMultiple: -0.5,
        setup: "Trend Pullback",
      },
    ],
  },
  {
    username: "kairo.fx",
    displayName: "Kairo FX",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=kairo.fx",
    bio: "Trend pullbacks in London + NY overlap. Focus: fewer trades, higher quality.",
    isPublic: true,
    primaryBroker: "MetaTrader Broker",
    reviewSettings: { canWriteReviews: true, allowProfileReviews: true },
    stats: {
      balance: 8420,
      winRate: 61,
      profitFactor: 1.9,
      avgRiskReward: 1.5,
      monthlyReturn: 8.2,
      streak: 3,
    },
    badges: [
      { id: "b-overlap", label: "Session specialist", tone: "violet" },
      { id: "b-review", label: "Weekly review", tone: "sky" },
    ],
    leaderboards: [
      { id: "lb-edge", label: "Edge days", rank: 44, total: 2413 },
      { id: "lb-discipline", label: "Discipline", rank: 28, total: 2413 },
    ],
    recentTrades: [
      {
        id: "t-4",
        symbol: "GBPUSD",
        side: "Short",
        dateLabel: "Today",
        pnl: 180,
        rMultiple: 1.3,
        setup: "Trend Pullback",
      },
      {
        id: "t-5",
        symbol: "EURUSD",
        side: "Long",
        dateLabel: "2d ago",
        pnl: -70,
        rMultiple: -0.5,
        setup: "Trend Pullback",
      },
    ],
  },
  {
    username: "pixel_pioneer",
    displayName: "Pixel Pips",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=pixel_pioneer",
    bio: "Pixel perfect entries on the 1m timeframe.",
    isPublic: true,
    primaryBroker: "TradeLocker",
    stats: { balance: 15000, winRate: 55, profitFactor: 2.1, avgRiskReward: 2.5, monthlyReturn: 45.2, streak: 8 },
    badges: [{ id: "b-review", label: "Weekly review", tone: "sky" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "quant_queen",
    displayName: "Hazel Quant",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=quant_queen",
    bio: "Algorithmic approach to crypto markets.",
    isPublic: true,
    primaryBroker: "Binance",
    stats: { balance: 25000, winRate: 72, profitFactor: 3.5, avgRiskReward: 1.2, monthlyReturn: 18.5, streak: 12 },
    badges: [{ id: "b-overlap", label: "Session specialist", tone: "violet" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "scalp_master",
    displayName: "Luna Scalper",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=scalp_master",
    bio: "High frequency scalping on Gold.",
    isPublic: true,
    primaryBroker: "MetaTrader",
    stats: { balance: 5000, winRate: 48, profitFactor: 1.8, avgRiskReward: 3.0, monthlyReturn: 62.1, streak: 2 },
    badges: [],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "safe_sally",
    displayName: "Safe Sally",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=safe_sally",
    bio: "Risk first. Capital preservation is key.",
    isPublic: true,
    primaryBroker: "OANDA",
    stats: { balance: 50000, winRate: 85, profitFactor: 4.2, avgRiskReward: 1.1, monthlyReturn: 5.2, streak: 20 },
    badges: [{ id: "b-risk", label: "Risk guard enabled", tone: "emerald" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "macro_mike",
    displayName: "Mike Macro",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=macro_mike",
    bio: "Trading the economic calendar.",
    isPublic: true,
    primaryBroker: "IBKR",
    stats: { balance: 12000, winRate: 60, profitFactor: 2.0, avgRiskReward: 2.0, monthlyReturn: 22.0, streak: 6 },
    badges: [{ id: "b-review", label: "Weekly review", tone: "sky" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "zenith_zone",
    displayName: "Zenith Zone",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=zenith_zone",
    bio: "Supply and demand zones.",
    isPublic: true,
    primaryBroker: "TradeLocker",
    stats: { balance: 8000, winRate: 65, profitFactor: 2.5, avgRiskReward: 1.8, monthlyReturn: 30.5, streak: 9 },
    badges: [{ id: "b-review", label: "Weekly review", tone: "sky" }, { id: "b-overlap", label: "Session specialist", tone: "violet" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "orbit_ops",
    displayName: "Orbit Ops",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=orbit_ops",
    bio: "Swing trading FX pairs.",
    isPublic: true,
    primaryBroker: "OANDA",
    stats: { balance: 18000, winRate: 50, profitFactor: 1.9, avgRiskReward: 2.2, monthlyReturn: 12.0, streak: 4 },
    badges: [{ id: "b-overlap", label: "Session specialist", tone: "violet" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "delta_dawn",
    displayName: "Delta Dawn",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=delta_dawn",
    bio: "Delta neutral strategies.",
    isPublic: true,
    primaryBroker: "Binance",
    stats: { balance: 100000, winRate: 90, profitFactor: 5.0, avgRiskReward: 0.8, monthlyReturn: 8.5, streak: 25 },
    badges: [{ id: "b-risk", label: "Risk guard enabled", tone: "emerald" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "echo_entry",
    displayName: "Echo Entry",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=echo_entry",
    bio: "Fibonacci retracements.",
    isPublic: true,
    primaryBroker: "MetaTrader",
    stats: { balance: 3000, winRate: 40, profitFactor: 1.5, avgRiskReward: 3.5, monthlyReturn: 55.0, streak: 1 },
    badges: [],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "flux_flow",
    displayName: "Flux Flow",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=flux_flow",
    bio: "Order flow trading.",
    isPublic: true,
    primaryBroker: "NinjaTrader",
    stats: { balance: 22000, winRate: 58, profitFactor: 2.2, avgRiskReward: 1.7, monthlyReturn: 25.0, streak: 7 },
    badges: [{ id: "b-review", label: "Weekly review", tone: "sky" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "gravity_guy",
    displayName: "Gravity Guy",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=gravity_guy",
    bio: "Mean reversion.",
    isPublic: true,
    primaryBroker: "IBKR",
    stats: { balance: 45000, winRate: 62, profitFactor: 2.3, avgRiskReward: 1.6, monthlyReturn: 15.0, streak: 5 },
    badges: [{ id: "b-overlap", label: "Session specialist", tone: "violet" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "horizon_hero",
    displayName: "Horizon Hero",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=horizon_hero",
    bio: "Long term trends.",
    isPublic: true,
    primaryBroker: "TradingView",
    stats: { balance: 60000, winRate: 45, profitFactor: 3.0, avgRiskReward: 4.0, monthlyReturn: 10.0, streak: 3 },
    badges: [],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "ion_pulse",
    displayName: "Ion Pulse",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=ion_pulse",
    bio: "Momentum ignition.",
    isPublic: true,
    primaryBroker: "TradeLocker",
    stats: { balance: 9500, winRate: 52, profitFactor: 1.7, avgRiskReward: 2.0, monthlyReturn: 35.0, streak: 4 },
    badges: [{ id: "b-review", label: "Weekly review", tone: "sky" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "jitter_jump",
    displayName: "Jitter Jump",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=jitter_jump",
    bio: "Volatility breakout.",
    isPublic: true,
    primaryBroker: "Bybit",
    stats: { balance: 7500, winRate: 35, profitFactor: 1.4, avgRiskReward: 4.5, monthlyReturn: 40.0, streak: 2 },
    badges: [],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "kinetic_kyle",
    displayName: "Kinetic Kyle",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=kinetic_kyle",
    bio: "Price action only.",
    isPublic: true,
    primaryBroker: "MetaTrader",
    stats: { balance: 14000, winRate: 70, profitFactor: 2.8, avgRiskReward: 1.5, monthlyReturn: 28.0, streak: 10 },
    badges: [{ id: "b-review", label: "Weekly review", tone: "sky" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "lumen_lux",
    displayName: "Lumen Lux",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=lumen_lux",
    bio: "Light in the dark markets.",
    isPublic: true,
    primaryBroker: "OANDA",
    stats: { balance: 32000, winRate: 66, profitFactor: 2.6, avgRiskReward: 1.6, monthlyReturn: 19.5, streak: 8 },
    badges: [{ id: "b-overlap", label: "Session specialist", tone: "violet" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "motion_max",
    displayName: "Motion Max",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=motion_max",
    bio: "Trend following.",
    isPublic: true,
    primaryBroker: "TradeLocker",
    stats: { balance: 28000, winRate: 55, profitFactor: 2.0, avgRiskReward: 2.1, monthlyReturn: 21.0, streak: 6 },
    badges: [{ id: "b-risk", label: "Risk guard enabled", tone: "emerald" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "nebula_nick",
    displayName: "Nebula Nick",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=nebula_nick",
    bio: "Trading the stars.",
    isPublic: true,
    primaryBroker: "Binance",
    stats: { balance: 11000, winRate: 48, profitFactor: 1.6, avgRiskReward: 2.8, monthlyReturn: 32.0, streak: 3 },
    badges: [{ id: "b-overlap", label: "Session specialist", tone: "violet" }],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "optic_ops",
    displayName: "Optic Ops",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=optic_ops",
    bio: "Visual patterns.",
    isPublic: true,
    primaryBroker: "TradingView",
    stats: { balance: 5500, winRate: 60, profitFactor: 2.4, avgRiskReward: 1.9, monthlyReturn: 24.5, streak: 5 },
    badges: [],
    leaderboards: [],
    recentTrades: []
  },
  {
    username: "prism_pat",
    displayName: "Prism Pat",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=prism_pat",
    bio: "Multi-timeframe analysis.",
    isPublic: true,
    primaryBroker: "IBKR",
    stats: { balance: 42000, winRate: 75, profitFactor: 3.2, avgRiskReward: 1.3, monthlyReturn: 16.0, streak: 15 },
    badges: [{ id: "b-review", label: "Weekly review", tone: "sky" }, { id: "b-risk", label: "Risk guard enabled", tone: "emerald" }],
    leaderboards: [],
    recentTrades: []
  },
];

export const demoPublicUsers: DemoPublicUserProfile[] = recomputeBadgeLeaderboardRanks(
  recomputeStandardLeaderboards(
    demoPublicUsersBase.map((u) => ensureUserHasTrades(ensureUserHasBadgeLeaderboards(u))),
  ),
);

export const demoBrokers: DemoAffiliateLink[] = [
  {
    id: "broker-1",
    kind: "broker",
    slug: "tradelocker",
    name: "TradeLocker",
    tagline: "Fast execution + clean UI for modern traders.",
    rating: 4.7,
    reviewCount: 12840,
    affiliateUrl: "https://example.com/aff/tradelocker",
    websiteUrl: "https://example.com/tradelocker",
    logoUrl: logo("TradeLocker"),
    badges: ["Top rated", "Low latency"],
    markets: ["FX", "Indices", "Gold"],
    pricingNote: "Spreads vary by account type.",
    highlights: ["Sub-200ms routing", "Mobile-friendly", "Risk controls"],
    pros: ["Snappy platform", "Simple order tickets", "Good mobile experience"],
    cons: ["Limited regional availability", "Some features gated by plan"],
  },
  {
    id: "broker-2",
    kind: "broker",
    slug: "binance",
    name: "Binance",
    tagline: "Deep liquidity for crypto spot + derivatives.",
    rating: 4.6,
    reviewCount: 512000,
    affiliateUrl: "https://example.com/aff/binance",
    websiteUrl: "https://example.com/binance",
    logoUrl: logo("Binance"),
    badges: ["Top rated", "Crypto"],
    markets: ["Crypto"],
    pricingNote: "Fees depend on volume tier.",
    highlights: ["High liquidity", "Advanced order types", "APIs"],
    pros: ["Great liquidity", "Good fee tiers", "Strong API ecosystem"],
    cons: ["Complex UI for beginners", "Region restrictions vary"],
  },
  {
    id: "broker-3",
    kind: "broker",
    slug: "metatrader",
    name: "MetaTrader Broker",
    tagline: "Classic MT platform compatibility.",
    rating: 4.2,
    reviewCount: 88900,
    affiliateUrl: "https://example.com/aff/metatrader",
    websiteUrl: "https://example.com/metatrader",
    logoUrl: logo("MetaTrader"),
    badges: ["Popular", "MT4/MT5"],
    markets: ["FX", "CFDs"],
    highlights: ["EAs + scripts", "Huge community", "Indicators"],
    pros: ["Massive ecosystem", "Automation support", "Familiar UI"],
    cons: ["Old-school UX", "Broker quality varies"],
  },
  {
    id: "broker-4",
    kind: "broker",
    slug: "tradingview",
    name: "TradingView Broker",
    tagline: "Chart-first trading workflow.",
    rating: 4.5,
    reviewCount: 204500,
    affiliateUrl: "https://example.com/aff/tradingview",
    websiteUrl: "https://example.com/tradingview",
    logoUrl: logo("TradingView"),
    badges: ["Charts", "Top rated"],
    markets: ["Stocks", "Crypto", "FX"],
    highlights: ["Best-in-class charts", "Alerts", "Strategy scripts"],
    pros: ["Incredible charting", "Great alerts", "Clean UI"],
    cons: ["Execution depends on connected broker", "Some features paid"],
  },
  {
    id: "broker-5",
    kind: "broker",
    slug: "oanda",
    name: "OANDA",
    tagline: "Trusted FX broker with solid tooling.",
    rating: 4.3,
    reviewCount: 74200,
    affiliateUrl: "https://example.com/aff/oanda",
    websiteUrl: "https://example.com/oanda",
    logoUrl: logo("OANDA"),
    badges: ["FX"],
    markets: ["FX", "Indices"],
    highlights: ["Strong regulation footprint", "Great analytics"],
    pros: ["Reliable", "Good reporting", "Competitive spreads"],
    cons: ["Platform varies by region", "Support wait times at peak"],
  },
  {
    id: "broker-6",
    kind: "broker",
    slug: "ibkr",
    name: "Interactive Brokers",
    tagline: "Pro-grade access to global markets.",
    rating: 4.4,
    reviewCount: 132000,
    affiliateUrl: "https://example.com/aff/ibkr",
    websiteUrl: "https://example.com/ibkr",
    logoUrl: logo("Interactive Brokers"),
    badges: ["Global", "Advanced"],
    markets: ["Stocks", "Options", "Futures", "FX"],
    highlights: ["Huge market access", "Low costs", "APIs"],
    pros: ["Market depth", "Low fees", "Advanced tooling"],
    cons: ["Steep learning curve", "UI feels dense"],
  },
  {
    id: "broker-7",
    kind: "broker",
    slug: "td365",
    name: "TD365",
    tagline: "Simple CFDs with fixed spreads.",
    rating: 4.1,
    reviewCount: 19000,
    affiliateUrl: "https://example.com/aff/td365",
    websiteUrl: "https://example.com/td365",
    logoUrl: logo("TD365"),
    badges: ["CFDs"],
    markets: ["Indices", "FX"],
    highlights: ["Straightforward pricing", "Easy onboarding"],
    pros: ["Simple", "Fixed spreads on many markets"],
    cons: ["Market selection smaller", "Fewer advanced order types"],
  },
  {
    id: "broker-8",
    kind: "broker",
    slug: "tastytrade",
    name: "tastytrade",
    tagline: "Options-first platform for active traders.",
    rating: 4.5,
    reviewCount: 68000,
    affiliateUrl: "https://example.com/aff/tastytrade",
    websiteUrl: "https://example.com/tastytrade",
    logoUrl: logo("tastytrade"),
    badges: ["Options", "Top rated"],
    markets: ["Options", "Stocks"],
    highlights: ["Great options chain UX", "Tools for spreads"],
    pros: ["Excellent options UX", "Educational content"],
    cons: ["Not ideal for FX", "Some features US-focused"],
  },
  {
    id: "broker-9",
    kind: "broker",
    slug: "alpaca",
    name: "Alpaca",
    tagline: "API broker for algorithmic trading.",
    rating: 4.2,
    reviewCount: 14500,
    affiliateUrl: "https://example.com/aff/alpaca",
    websiteUrl: "https://example.com/alpaca",
    logoUrl: logo("Alpaca"),
    badges: ["API", "Algo"],
    markets: ["Stocks", "Crypto"],
    highlights: ["Developer friendly", "Fast integration"],
    pros: ["Clean APIs", "Great for automation"],
    cons: ["Less suited for discretionary UI-first traders"],
  },
  {
    id: "broker-10",
    kind: "broker",
    slug: "bybit",
    name: "Bybit",
    tagline: "Derivatives-focused crypto exchange.",
    rating: 4.4,
    reviewCount: 238000,
    affiliateUrl: "https://example.com/aff/bybit",
    websiteUrl: "https://example.com/bybit",
    logoUrl: logo("Bybit"),
    badges: ["Crypto", "Derivatives"],
    markets: ["Crypto"],
    highlights: ["Good perpetual liquidity", "Risk tools"],
    pros: ["Good liquidity", "Strong risk controls"],
    cons: ["Region restrictions vary", "Complex for beginners"],
  },
  {
    id: "broker-11",
    kind: "broker",
    slug: "fxcm",
    name: "FXCM",
    tagline: "FX specialist with long history.",
    rating: 4.0,
    reviewCount: 52000,
    affiliateUrl: "https://example.com/aff/fxcm",
    websiteUrl: "https://example.com/fxcm",
    logoUrl: logo("FXCM"),
    badges: ["FX"],
    markets: ["FX", "Indices"],
    highlights: ["FX focus", "Analytics tools"],
    pros: ["Solid FX offering", "Research tools"],
    cons: ["Fees vary by region", "Platform options differ"],
  },
  {
    id: "broker-12",
    kind: "broker",
    slug: "okx",
    name: "OKX",
    tagline: "All-in-one crypto platform.",
    rating: 4.3,
    reviewCount: 198000,
    affiliateUrl: "https://example.com/aff/okx",
    websiteUrl: "https://example.com/okx",
    logoUrl: logo("OKX"),
    badges: ["Crypto"],
    markets: ["Crypto"],
    highlights: ["Spot + perps", "APIs"],
    pros: ["Strong product suite", "Good APIs"],
    cons: ["Complex UX", "Region restrictions vary"],
  },
  {
    id: "broker-13",
    kind: "broker",
    slug: "kraken",
    name: "Kraken",
    tagline: "Security-first crypto exchange.",
    rating: 4.4,
    reviewCount: 164000,
    affiliateUrl: "https://example.com/aff/kraken",
    websiteUrl: "https://example.com/kraken",
    logoUrl: logo("Kraken"),
    badges: ["Crypto", "Security"],
    markets: ["Crypto"],
    highlights: ["Strong security posture", "Trusted brand"],
    pros: ["Security focus", "Good support"],
    cons: ["Fees can be higher for small volume"],
  },
  {
    id: "broker-14",
    kind: "broker",
    slug: "ninjatrader",
    name: "NinjaTrader",
    tagline: "Futures trading platform + brokerage.",
    rating: 4.3,
    reviewCount: 41000,
    affiliateUrl: "https://example.com/aff/ninjatrader",
    websiteUrl: "https://example.com/ninjatrader",
    logoUrl: logo("NinjaTrader"),
    badges: ["Futures"],
    markets: ["Futures"],
    highlights: ["Futures tools", "Add-ons ecosystem"],
    pros: ["Great futures tooling", "Active community"],
    cons: ["Desktop heavy", "Learning curve"],
  },
  {
    id: "broker-15",
    kind: "broker",
    slug: "thinkorswim",
    name: "thinkorswim",
    tagline: "Feature-rich trading platform.",
    rating: 4.2,
    reviewCount: 99000,
    affiliateUrl: "https://example.com/aff/thinkorswim",
    websiteUrl: "https://example.com/thinkorswim",
    logoUrl: logo("thinkorswim"),
    badges: ["Advanced"],
    markets: ["Stocks", "Options"],
    highlights: ["Pro tools", "Paper trading"],
    pros: ["Powerful tools", "Great scanners"],
    cons: ["Dense UI", "Region availability varies"],
  },
];

export const demoPropFirms: DemoAffiliateLink[] = [
  {
    id: "firm-1",
    kind: "firm",
    slug: "ftmo",
    name: "FTMO",
    tagline: "Popular evaluations with strong tooling.",
    rating: 4.7,
    reviewCount: 185000,
    affiliateUrl: "https://example.com/aff/ftmo",
    websiteUrl: "https://example.com/ftmo",
    logoUrl: logo("FTMO"),
    badges: ["Top rated"],
    markets: ["FX", "Indices", "Metals"],
    pricingNote: "Evaluation fees depend on account size.",
    highlights: ["Clear rules", "Great analytics", "Fast payouts (varies)"],
    pros: ["Well-known brand", "Good dashboards", "Clear scaling paths"],
    cons: ["Rules strict for some styles", "News rules vary"],
  },
  {
    id: "firm-2",
    kind: "firm",
    slug: "topstep",
    name: "Topstep",
    tagline: "Futures prop firm with structured programs.",
    rating: 4.6,
    reviewCount: 92000,
    affiliateUrl: "https://example.com/aff/topstep",
    websiteUrl: "https://example.com/topstep",
    logoUrl: logo("Topstep"),
    badges: ["Futures", "Top rated"],
    markets: ["Futures"],
    highlights: ["Futures focus", "Rule clarity", "Strong community"],
    pros: ["Good education", "Futures programs", "Clear rules"],
    cons: ["Scaling rules vary", "Platform options vary"],
  },
  {
    id: "firm-3",
    kind: "firm",
    slug: "fundednext",
    name: "FundedNext",
    tagline: "Flexible evaluation styles (varies).",
    rating: 4.3,
    reviewCount: 61000,
    affiliateUrl: "https://example.com/aff/fundednext",
    websiteUrl: "https://example.com/fundednext",
    logoUrl: logo("FundedNext"),
    badges: ["Popular"],
    markets: ["FX", "Indices"],
    highlights: ["Multiple program types", "Trader-friendly UX"],
    pros: ["Lots of options", "Good onboarding"],
    cons: ["Terms change over time", "Rule set differences per program"],
  },
  {
    id: "firm-4",
    kind: "firm",
    slug: "the5ers",
    name: "The5ers",
    tagline: "Scaling plans with longer-term focus.",
    rating: 4.4,
    reviewCount: 54000,
    affiliateUrl: "https://example.com/aff/the5ers",
    websiteUrl: "https://example.com/the5ers",
    logoUrl: logo("The5ers"),
    badges: ["Scaling"],
    markets: ["FX", "Indices", "Metals"],
    highlights: ["Scaling path", "Consistent rules"],
    pros: ["Good scaling", "Clear rule sets"],
    cons: ["Less ideal for high-frequency styles"],
  },
  {
    id: "firm-5",
    kind: "firm",
    slug: "myforexfunds",
    name: "MyForexFunds (Mock)",
    tagline: "Demo entry for layout testing.",
    rating: 4.1,
    reviewCount: 48000,
    affiliateUrl: "https://example.com/aff/mff",
    websiteUrl: "https://example.com/mff",
    logoUrl: logo("MFF"),
    badges: ["Demo"],
    markets: ["FX", "Indices"],
    highlights: ["Mock listing", "Placeholder rules"],
    pros: ["Good UX (mock)", "Fast setup (mock)"],
    cons: ["Demo data entry", "Replace with real firm list"],
  },
  {
    id: "firm-6",
    kind: "firm",
    slug: "apex",
    name: "Apex Trader Funding",
    tagline: "Futures evaluations and funding programs.",
    rating: 4.4,
    reviewCount: 105000,
    affiliateUrl: "https://example.com/aff/apex",
    websiteUrl: "https://example.com/apex",
    logoUrl: logo("Apex"),
    badges: ["Futures"],
    markets: ["Futures"],
    highlights: ["Futures focus", "Multiple account sizes"],
    pros: ["Lots of programs", "Popular in futures"],
    cons: ["Rules vary per program", "Payout rules change"],
  },
  {
    id: "firm-7",
    kind: "firm",
    slug: "earn2trade",
    name: "Earn2Trade",
    tagline: "Education + evaluation (futures).",
    rating: 4.2,
    reviewCount: 31000,
    affiliateUrl: "https://example.com/aff/earn2trade",
    websiteUrl: "https://example.com/earn2trade",
    logoUrl: logo("Earn2Trade"),
    badges: ["Futures", "Education"],
    markets: ["Futures"],
    highlights: ["Curriculum", "Structured programs"],
    pros: ["Education included", "Clear structure"],
    cons: ["Less flexible for some styles"],
  },
  {
    id: "firm-8",
    kind: "firm",
    slug: "traderscentral",
    name: "Traders Central (Mock)",
    tagline: "Mock prop firm listing.",
    rating: 4.0,
    reviewCount: 12000,
    affiliateUrl: "https://example.com/aff/traderscentral",
    websiteUrl: "https://example.com/traderscentral",
    logoUrl: logo("Traders Central"),
    badges: ["Demo"],
    markets: ["FX"],
    highlights: ["Mock listing", "Placeholder"],
    pros: ["Fast UI", "Simple rules (mock)"],
    cons: ["Demo data entry"],
  },
  {
    id: "firm-9",
    kind: "firm",
    slug: "blueguardian",
    name: "Blue Guardian",
    tagline: "Trader-first eval options (varies).",
    rating: 4.2,
    reviewCount: 22000,
    affiliateUrl: "https://example.com/aff/blueguardian",
    websiteUrl: "https://example.com/blueguardian",
    logoUrl: logo("Blue Guardian"),
    badges: ["Popular"],
    markets: ["FX", "Indices"],
    highlights: ["Multiple challenge types"],
    pros: ["Options variety", "Good UX"],
    cons: ["Program terms can change"],
  },
  {
    id: "firm-10",
    kind: "firm",
    slug: "fundingpips",
    name: "FundingPips",
    tagline: "Evaluation programs and scaling.",
    rating: 4.1,
    reviewCount: 18000,
    affiliateUrl: "https://example.com/aff/fundingpips",
    websiteUrl: "https://example.com/fundingpips",
    logoUrl: logo("FundingPips"),
    badges: ["Popular"],
    markets: ["FX", "Indices"],
    highlights: ["Scaling path", "Fast onboarding"],
    pros: ["Easy onboarding", "Clear UI"],
    cons: ["Rule details vary by plan"],
  },
  {
    id: "firm-11",
    kind: "firm",
    slug: "fundedtrader",
    name: "The Funded Trader",
    tagline: "High-visibility firm (terms vary).",
    rating: 4.0,
    reviewCount: 45000,
    affiliateUrl: "https://example.com/aff/thefundedtrader",
    websiteUrl: "https://example.com/thefundedtrader",
    logoUrl: logo("The Funded Trader"),
    badges: ["Popular"],
    markets: ["FX", "Indices"],
    highlights: ["Multiple evaluation styles"],
    pros: ["Lots of programs", "Good visibility"],
    cons: ["Policies change over time"],
  },
  {
    id: "firm-12",
    kind: "firm",
    slug: "surge",
    name: "SurgeTrader",
    tagline: "Straightforward funding (varies).",
    rating: 4.0,
    reviewCount: 25000,
    affiliateUrl: "https://example.com/aff/surge",
    websiteUrl: "https://example.com/surge",
    logoUrl: logo("SurgeTrader"),
    badges: ["Popular"],
    markets: ["FX", "Indices"],
    highlights: ["Simple path", "Clear UI"],
    pros: ["Simple offering", "Good onboarding"],
    cons: ["Less flexible", "Terms can change"],
  },
  {
    id: "firm-13",
    kind: "firm",
    slug: "citytraders",
    name: "City Traders Imperium",
    tagline: "Scaling with coaching options.",
    rating: 4.2,
    reviewCount: 27000,
    affiliateUrl: "https://example.com/aff/cti",
    websiteUrl: "https://example.com/cti",
    logoUrl: logo("CTI"),
    badges: ["Coaching"],
    markets: ["FX", "Indices"],
    highlights: ["Coaching", "Scaling"],
    pros: ["Support options", "Clear scaling"],
    cons: ["Varied plans", "Rule differences"],
  },
  {
    id: "firm-14",
    kind: "firm",
    slug: "fundedtradingplus",
    name: "Funded Trading Plus",
    tagline: "Multiple accounts + scaling (varies).",
    rating: 4.1,
    reviewCount: 21000,
    affiliateUrl: "https://example.com/aff/ftp",
    websiteUrl: "https://example.com/ftp",
    logoUrl: logo("Funded Trading Plus"),
    badges: ["Scaling"],
    markets: ["FX", "Indices"],
    highlights: ["Scaling", "Multiple account options"],
    pros: ["Account options", "Clear UX"],
    cons: ["Terms vary", "Rule differences per plan"],
  },
  {
    id: "firm-15",
    kind: "firm",
    slug: "fundedengineer",
    name: "Funded Engineer (Mock)",
    tagline: "Mock listing to round out demo data.",
    rating: 3.9,
    reviewCount: 9000,
    affiliateUrl: "https://example.com/aff/fundedengineer",
    websiteUrl: "https://example.com/fundedengineer",
    logoUrl: logo("Funded Engineer"),
    badges: ["Demo"],
    markets: ["FX"],
    highlights: ["Mock listing", "Placeholder content"],
    pros: ["Good layout test", "Consistent schema"],
    cons: ["Demo data entry"],
  },
];

const hashString = (input: string) => {
  // Deterministic small hash (non-crypto) for stable mock generation.
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const makeIsoDate = (seed: string, index: number) => {
  const base = Date.UTC(2026, 0, 17, 20, 0, 0); // Jan 17 2026 20:00 UTC
  const h = hashString(seed);
  const daysBack = (h % 21) + index; // 0..22
  const hours = (h % 12) + index; // 0..13
  const ms = base - daysBack * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000;
  return new Date(ms).toISOString();
};

const reviewTemplates = {
  firm: [
    {
      rating: 5,
      title: "Solid rules and smooth onboarding",
      body: "Clear objectives, consistent rule set, and onboarding that doesn’t waste time.",
    },
    {
      rating: 4,
      title: "Great overall, read the fine print",
      body: "I like the structure and support, but always double-check rule changes and payout terms.",
    },
    {
      rating: 3,
      title: "Good concept, mixed experience",
      body: "Some parts are excellent, others feel a bit rigid depending on your style.",
    },
  ],
  broker: [
    {
      rating: 5,
      title: "Execution feels consistent",
      body: "Spreads/fees depend on account/tier, but overall execution has been reliable for me.",
    },
    {
      rating: 4,
      title: "Powerful platform, a bit complex",
      body: "Once configured it’s smooth, but there’s a learning curve if you’re new.",
    },
    {
      rating: 3,
      title: "Decent, but UX could be cleaner",
      body: "Works well enough, just wish the UI was a bit more focused and less noisy.",
    },
  ],
  user: [
    {
      rating: 5,
      title: "Clean plan + disciplined execution",
      body: "Trades are consistent with the stated edge and the reviews are actually informative.",
    },
    {
      rating: 4,
      title: "Great setups, would love more detail",
      body: "Strong ideas—more screenshots/notes on invalidations would make it even better.",
    },
    {
      rating: 5,
      title: "Quality over quantity",
      body: "Love the focus on fewer trades and higher quality sessions. Good risk mindset.",
    },
  ],
} as const;

const getReviewAuthor = (seed: string, excludeUsername?: string) => {
  const users = demoPublicUsers.filter((u) => u.isPublic);
  if (users.length === 0) {
    return { username: "demo", displayName: "Demo User", avatarUrl: undefined };
  }
  const filtered = excludeUsername
    ? users.filter((u) => u.username.toLowerCase() !== excludeUsername.toLowerCase())
    : users;
  const pool = filtered.length > 0 ? filtered : users;
  const idx = hashString(seed) % pool.length;
  const u = pool[idx]!;
  return { username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl };
};

const safeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const demoReviews: DemoReview[] = [
  // Firms: 2 each
  ...demoPropFirms.flatMap((f) => {
    const k = `firm:${f.slug}`;
    const t1 = reviewTemplates.firm[hashString(k) % reviewTemplates.firm.length]!;
    const t2 =
      reviewTemplates.firm[(hashString(k + ":2") + 1) % reviewTemplates.firm.length]!;
    return [
      {
        id: `rev-firm-${safeKey(f.slug)}-1`,
        target: { kind: "firm" as const, slug: f.slug },
        rating: t1.rating,
        title: t1.title,
        body: t1.body,
        createdAt: makeIsoDate(k, 0),
        author: getReviewAuthor(k + ":a"),
      },
      {
        id: `rev-firm-${safeKey(f.slug)}-2`,
        target: { kind: "firm" as const, slug: f.slug },
        rating: t2.rating,
        title: t2.title,
        body: t2.body,
        createdAt: makeIsoDate(k, 1),
        author: getReviewAuthor(k + ":b"),
      },
    ];
  }),
  // Brokers: 2 each
  ...demoBrokers.flatMap((b) => {
    const k = `broker:${b.slug}`;
    const t1 =
      reviewTemplates.broker[hashString(k) % reviewTemplates.broker.length]!;
    const t2 =
      reviewTemplates.broker[(hashString(k + ":2") + 1) % reviewTemplates.broker.length]!;
    return [
      {
        id: `rev-broker-${safeKey(b.slug)}-1`,
        target: { kind: "broker" as const, slug: b.slug },
        rating: t1.rating,
        title: t1.title,
        body: t1.body,
        createdAt: makeIsoDate(k, 0),
        author: getReviewAuthor(k + ":a"),
      },
      {
        id: `rev-broker-${safeKey(b.slug)}-2`,
        target: { kind: "broker" as const, slug: b.slug },
        rating: t2.rating,
        title: t2.title,
        body: t2.body,
        createdAt: makeIsoDate(k, 1),
        author: getReviewAuthor(k + ":b"),
      },
    ];
  }),
  // Users: 2 each (no self-reviews)
  ...demoPublicUsers
    .filter((u) => u.isPublic)
    .flatMap((u) => {
      const k = `user:${u.username.toLowerCase()}`;
      const t1 = reviewTemplates.user[hashString(k) % reviewTemplates.user.length]!;
      const t2 =
        reviewTemplates.user[(hashString(k + ":2") + 1) % reviewTemplates.user.length]!;
      return [
        {
          id: `rev-user-${safeKey(u.username)}-1`,
          target: { kind: "user" as const, username: u.username },
          rating: t1.rating,
          title: t1.title,
          body: t1.body,
          createdAt: makeIsoDate(k, 0),
          author: getReviewAuthor(k + ":a", u.username),
        },
        {
          id: `rev-user-${safeKey(u.username)}-2`,
          target: { kind: "user" as const, username: u.username },
          rating: t2.rating,
          title: t2.title,
          body: t2.body,
          createdAt: makeIsoDate(k, 1),
          author: getReviewAuthor(k + ":b", u.username),
        },
      ];
    }),
];

export const demoData: DemoData = demoDataSchema.parse({
  dashboard: {
    stats: demoDashboardStats,
    calendarDailyStats: demoCalendarDailyStats,
    insights: demoInsights,
    reviewTrades: demoReviewTrades,
  },
  notifications: demoNotifications,
  affiliates: {
    brokers: demoBrokers,
    firms: demoPropFirms,
  },
});
