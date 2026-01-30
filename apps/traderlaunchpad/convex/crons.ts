import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// Poll for due Discord automations frequently; schedules are computed via nextRunAt.
crons.interval(
  "run_discord_automations",
  { minutes: 1 },
  internal.discord.automations.runDueDiscordAutomations,
  {},
);

// Platform price data sync (continuous rules).
crons.interval(
  "run_platform_price_data_sync",
  { minutes: 1 },
  internal.platform.priceDataSyncSchedulerInternal.runDuePriceDataSyncRules,
  {},
);

// Platform news/economic calendar ingestion.
crons.interval(
  "run_platform_news_ingest",
  { minutes: 1 },
  internal.platform.newsSchedulerInternal.runDueNewsSources,
  {},
);

// User TradeLocker autosync (invite-only MVP).
crons.interval(
  "run_tradelocker_autosync",
  { minutes: 1 },
  internal.traderlaunchpad.autosync.runDueTradeLockerAutosync,
  {},
);

export default crons;

