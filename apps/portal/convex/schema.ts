import { defineSchema } from "convex/server";

import { postsSchema } from "./core/posts/schema";
import { coreSchema } from "./core/schema";
import { usersSchema } from "./core/users/schema";
import { integrationsSchema } from "./integrations/schema";
// Add integrations schema
// import { integrationsSchema } from "./integrations/schema";
import { notificationsSchema } from "./notifications/schema";
import { supportSchema } from "./plugins/support/schema";
import { lmsSchema } from "./plugins/lms/schema";
import { tasksSchema } from "./tasks/schema";
import { vimeoSchema } from "./vimeo/schema";

// Define the main schema that includes all tables
export default defineSchema({
  // Support plugin tables
  ...supportSchema,

  // Integrations tables
  ...integrationsSchema,

  // Notifications tables
  ...notificationsSchema,

  // Social Feed tables
  // NOTE: socialfeed tables now live inside the mounted `launchthat_socialfeed` Convex Component
  // and are no longer part of the portal's main schema.

  // Users tables
  ...usersSchema,

  // Vimeo videos
  ...vimeoSchema,

  // Tasks
  ...tasksSchema,

  // Posts
  ...postsSchema,

  // Core options (site/store settings)
  ...coreSchema,

  // LMS plugin tables (portal-owned)
  ...lmsSchema,
});
