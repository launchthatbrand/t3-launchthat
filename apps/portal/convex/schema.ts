import { coreSchema } from "./core/schema";
import { defineSchema } from "convex/server";
import { ecommerceSchema } from "./ecommerce/schema";
import { integrationsSchema } from "./integrations/schema";
import { lmsSchema } from "./lms/schema";
// Add integrations schema
// import { integrationsSchema } from "./integrations/schema";
import { notificationsSchema } from "./notifications/schema";
import { postsSchema } from "./core/posts/schema";
import { socialFeedSchema } from "./plugins/socialfeed/schema";
import { supportSchema } from "./plugins/support/schema";
import { tasksSchema } from "./tasks/schema";
import { usersSchema } from "./core/users/schema";
import { vimeoSchema } from "./vimeo/schema";

// Define the main schema that includes all tables
export default defineSchema({
  // Support plugin tables
  ...supportSchema,

  // Ecommerce tables
  ...ecommerceSchema,

  // Integrations tables
  ...integrationsSchema,

  // Notifications tables
  ...notificationsSchema,

  // Social Feed tables
  ...socialFeedSchema,

  // LMS tables
  ...lmsSchema,

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
