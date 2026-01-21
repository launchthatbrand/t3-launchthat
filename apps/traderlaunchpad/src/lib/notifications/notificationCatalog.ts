export type TraderLaunchpadNotificationCategory = "plan" | "insights" | "system";

export type TraderLaunchpadNotificationSinkId = "inApp" | "email";

export type TraderLaunchpadNotificationEventDefinition = {
  eventKey: string;
  label: string;
  description?: string;
  category: TraderLaunchpadNotificationCategory;
  tabKey: "plan" | "insights" | "system";

  /**
   * Defaults for test harness prefill (and future settings UI).
   */
  defaultTitle: string;
  defaultContent?: string;
  defaultActionUrl?: string;
  defaultSinkIds: TraderLaunchpadNotificationSinkId[];
};

/**
 * TraderLaunchpad-specific event catalog.
 * This is app-owned (NOT component-owned) because it reflects what the product promises
 * and what the app actually implements.
 */
export const TRADERLAUNCHPAD_NOTIFICATION_EVENTS: TraderLaunchpadNotificationEventDefinition[] =
  [
    // System / developer
    {
      eventKey: "traderlaunchpad.system.test",
      label: "Test notification (dev)",
      description: "Manual test event for the platform settings harness.",
      category: "system",
      tabKey: "system",
      defaultTitle: "Test notification",
      defaultContent: "This is a test.",
      defaultActionUrl: "/admin/tradingplan",
      defaultSinkIds: ["inApp", "email"],
    },
    {
      eventKey: "traderlaunchpad.system.announcement",
      label: "System announcement",
      description: "Platform announcements and important updates.",
      category: "system",
      tabKey: "system",
      defaultTitle: "Announcement",
      defaultContent: "Heads up—there’s an important update in your dashboard.",
      defaultActionUrl: "/admin/dashboard",
      defaultSinkIds: ["inApp", "email"],
    },

    // Plan
    {
      eventKey: "traderlaunchpad.plan.violation",
      label: "Trading plan violation",
      description: "General rule violation alert (when you break a plan rule).",
      category: "plan",
      tabKey: "plan",
      defaultTitle: "Violating trading plan",
      defaultContent:
        "You just broke one of your trading plan rules. Review the rule and consider stopping for the session.",
      defaultActionUrl: "/admin/tradingplan",
      defaultSinkIds: ["inApp", "email"],
    },
    {
      eventKey: "traderlaunchpad.plan.stopTrading",
      label: "Stop trading alert",
      description:
        "High-severity alert: you've hit a stop condition (risk limit / max losses / max trades).",
      category: "plan",
      tabKey: "plan",
      defaultTitle: "Stop trading",
      defaultContent:
        "You’ve hit a stop condition. Stop trading for this session and review your plan.",
      defaultActionUrl: "/admin/tradingplan",
      defaultSinkIds: ["inApp", "email"],
    },
    {
      eventKey: "traderlaunchpad.plan.riskLimitHit",
      label: "Risk limit hit",
      description: "Alert when daily/weekly risk limits are reached.",
      category: "plan",
      tabKey: "plan",
      defaultTitle: "Risk limit reached",
      defaultContent:
        "You’ve reached your configured risk limit. Consider stopping to protect capital and consistency.",
      defaultActionUrl: "/admin/tradingplan",
      defaultSinkIds: ["inApp", "email"],
    },

    // Insights
    {
      eventKey: "traderlaunchpad.insights.bestTradingWindow",
      label: "Best trading window",
      description: "Nudge when your best trading window is active.",
      category: "insights",
      tabKey: "insights",
      defaultTitle: "Best time to trade",
      defaultContent:
        "Your best trading window is active. If you’re trading today, focus on A+ setups.",
      defaultActionUrl: "/admin/dashboard",
      defaultSinkIds: ["inApp"],
    },
    {
      eventKey: "traderlaunchpad.insights.edgeDayReminder",
      label: "Edge day reminder",
      description: "Reminder for edge days and strong historical performance windows.",
      category: "insights",
      tabKey: "insights",
      defaultTitle: "Edge day",
      defaultContent:
        "Historically, you perform best today. Trade your plan and keep risk tight.",
      defaultActionUrl: "/admin/dashboard",
      defaultSinkIds: ["inApp"],
    },
    {
      eventKey: "traderlaunchpad.insights.dailySummary",
      label: "Daily AI summary",
      description: "Daily overview + AI insights based on your journal and plan.",
      category: "insights",
      tabKey: "insights",
      defaultTitle: "Daily summary",
      defaultContent:
        "Here’s your daily overview: wins, losses, risk stats, and your top focus for tomorrow.",
      defaultActionUrl: "/admin/dashboard",
      defaultSinkIds: ["email"],
    },
  ];

export const buildTraderLaunchpadNotificationCatalog = () =>
  TRADERLAUNCHPAD_NOTIFICATION_EVENTS.slice();

