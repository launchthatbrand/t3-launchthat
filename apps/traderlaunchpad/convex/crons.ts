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

export default crons;

