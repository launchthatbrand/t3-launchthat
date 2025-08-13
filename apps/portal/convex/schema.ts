import { defineSchema } from "convex/server";

import calendarSchema from "./calendar/schema";
import { optionsSchema } from "./core/options/schema";
import { postsSchema } from "./core/schema/postsSchema";
import ecommerceSchema from "./ecommerce/schema";
// Add integrations schema
import integrationsSchema from "./integrations/schema";
import { lmsSchema } from "./lms/schema";
import { notificationsSchema } from "./notifications/schema";
import socialFeedSchema from "./socialfeed/schema";
import { tasksSchema } from "./tasks/schema";
import { schema as usersSchema } from "./users/schema";
import { vimeoSchema } from "./vimeo/schema";

// Define the main schema that includes all tables
export default defineSchema({
  // Calendar tables
  ...calendarSchema.tables,

  // Ecommerce tables
  ...ecommerceSchema.tables,

  // LMS tables
  ...lmsSchema.tables,

  // Notifications tables
  ...notificationsSchema.tables,

  // Social Feed tables
  ...socialFeedSchema.tables,

  // Users tables
  ...usersSchema.tables,

  // Vimeo videos
  ...vimeoSchema.tables,

  // Tasks
  ...tasksSchema,

  // Posts
  ...postsSchema.tables,

  // Core options (site/store settings)
  ...optionsSchema.tables,

  // Integrations (apps, connections, scenarios, nodes, nodeConnections, logs)
  ...integrationsSchema.tables,
});
