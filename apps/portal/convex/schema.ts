import { defineSchema } from "convex/server";

import { calendarSchema } from "./calendar/schema";
import { postsSchema } from "./core/posts/schema";
import { coreSchema } from "./core/schema";
import { usersSchema } from "./core/users/schema";
import { ecommerceSchema } from "./ecommerce/schema";
import { integrationsSchema } from "./integrations/schema";
// Add integrations schema
// import { integrationsSchema } from "./integrations/schema";
import { lmsSchema } from "./lms/schema";
import { notificationsSchema } from "./notifications/schema";
import { supportSchema } from "./plugins/support/schema";
import { socialFeedSchema } from "./socialfeed/schema";
import { tasksSchema } from "./tasks/schema";
import { vimeoSchema } from "./vimeo/schema";

// Define the main schema that includes all tables
export default defineSchema({
  // Support plugin tables
  ...supportSchema,

  // Calendar tables
  ...calendarSchema,

  // Ecommerce tables
  ...ecommerceSchema,

  // Integrations tables
  ...integrationsSchema,

  // LMS tables
  ...lmsSchema,

  // Notifications tables
  ...notificationsSchema,

  // Social Feed tables
  ...socialFeedSchema,

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
});
