import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// TradeLocker polling (runs even when users are logged out).
// - Mentors: 1 minute
// - Active members: 3 minutes
// - Warm members: 10 minutes
crons.interval(
  "traderlaunchpad TradeLocker poll mentors",
  { minutes: 1 },
  internal.plugins.traderlaunchpad.polling.pollMentors,
  { maxConnections: 20 },
);

crons.interval(
  "traderlaunchpad TradeLocker poll members active",
  { minutes: 3 },
  internal.plugins.traderlaunchpad.polling.pollMembersActive,
  { maxConnections: 50 },
);

crons.interval(
  "traderlaunchpad TradeLocker poll members warm",
  { minutes: 10 },
  internal.plugins.traderlaunchpad.polling.pollMembersWarm,
  { maxConnections: 100 },
);

export default crons;


