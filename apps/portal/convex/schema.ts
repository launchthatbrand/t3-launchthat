import { defineSchema } from "convex/server";

import { postsSchema } from "./core/posts/schema";
import { coreSchema } from "./core/schema";
import { usersSchema } from "./core/users/schema";
import { integrationsSchema } from "./integrations/schema";
// Add integrations schema
// import { integrationsSchema } from "./integrations/schema";
import { notificationsSchema } from "./notifications/schema";

// import { lmsSchema } from "./plugins/lms/schema";

// Define the main schema that includes all tables
export default defineSchema({
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
  // NOTE: Vimeo tables now live inside the mounted `launchthat_vimeo` Convex Component
  // and are no longer part of the portal's main schema.

  // Tasks
  // NOTE: tasks/taskBoards tables now live inside the mounted `launchthat_tasks` Convex Component
  // and are no longer part of the portal's main schema.

  // Posts
  ...postsSchema,

  // Core options (site/store settings)
  ...coreSchema,

  // LMS plugin tables (portal-owned)
  // ...lmsSchema,
});
