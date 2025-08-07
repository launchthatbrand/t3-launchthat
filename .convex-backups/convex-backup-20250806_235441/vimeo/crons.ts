import { cronJobs } from "convex/server";
import { v } from "convex/values";

import { internal } from "../_generated/api";

const crons = cronJobs();

// Every 24 hours, sync all Vimeo connections
crons.interval(
  "sync vimeo videos", // name
  { hours: 24 },
  internal.vimeo.actions.syncAllConnections,
  {},
);

export default crons;
