import { cronJobs } from "convex/server";
import { internal } from "../../_generated/api";

const crons = cronJobs();

// Every 24 hours, run a capped backstop sync for all Vimeo connections.
// Webhooks should handle near-real-time updates; this is just a reconciliation pass.
crons.interval(
  "vimeo nightly backstop sync",
  { hours: 24 },
  internal.plugins.vimeo.actions.runNightlyBackstopSync,
  {},
);

export default crons;
