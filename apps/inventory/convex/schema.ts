// Import all the schema definitions from the modular schema files
// Assuming these are results from defineSchema() calls in their respective files

// Import new modular calendar schema
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import calendarSchema from "./calendar/schema";
import cmsSchema from "./cms/schema";
import contactsSchema from "./contacts/schema";
import { coreSchema } from "./core/schema"; // This should be the result of defineSchema()
import { downloadsSchema } from "./downloads/schema";
import ecommerceSchema from "./ecommerce/schema";
import { groupsSchema } from "./groups/schema";
import { integrationsSchema } from "./integrations_old/schema"; // Added integrations schema
import { lmsSchema } from "./lms/schema";
import mondaySchema from "./monday/schema";
import { notificationsSchema } from "./notifications/schema";
import rulesEngineSchema from "./rules/schema";
import socialFeedSchema from "./socialfeed/schema";
import { usersSchema } from "./users/schema";

// Import new schema modules
// import { groupsSchema } from "./groupsSchema"; // REMOVE THIS
// import { unifiedProductSchema } from "./unifiedProductSchema"; // REMOVE THIS

// import { calendarSchema } from "./calendarSchema"; // REMOVE THIS
// import { cartSchema } from "./cartSchema"; // REMOVE THIS (old direct import)
// import { contactsSchema } from "./contacts/contactsSchema"; // REMOVE THIS

// Import existing schemas
// import { usersSchema } from "./usersSchema";

// Keep existing posts table definition here for now
/* REMOVE postsTable definition
export const postsTable = defineTable({
  title: v.string(),
  content: v.string(),
});
*/

// Extract only the transactions table from ecommerceSchema to avoid conflicts
/* REMOVE THIS BLOCK
const { products: _, ...ecommerceSchemaWithoutProducts } = ecommerceSchemaFull;
*/

// Extract only the product-related tables from ecommerceCategoriesSchema to avoid conflicts
/* REMOVE THIS BLOCK
const {
  products: ___,
  productCategories,
} = ecommerceCategoriesSchema; // Keep for now
*/

// Define the main schema that includes all tables
export default defineSchema({
  // Calendar tables
  ...calendarSchema.tables,

  // CMS tables
  ...cmsSchema.tables,

  // Contacts tables
  ...contactsSchema.tables,

  // Core tables
  ...coreSchema.tables,

  // Downloads tables
  ...downloadsSchema.tables,

  // Ecommerce tables
  ...ecommerceSchema.tables,

  // Groups tables
  ...groupsSchema.tables,

  // Integrations tables
  ...integrationsSchema.tables,

  // LMS tables
  ...lmsSchema.tables,

  // Monday.com integration tables
  ...mondaySchema.tables,

  // Notifications tables
  ...notificationsSchema.tables,

  // Rules engine tables
  ...rulesEngineSchema.tables,

  // Social Feed tables
  ...socialFeedSchema.tables,

  // Users tables
  ...usersSchema.tables,

  // ...unifiedProductSchema, // REMOVE THIS SPREAD

  // posts: postsTable, // REMOVE - now in coreSchema
  // checkoutSessions: checkoutSessionsTable, // REMOVE - now in newModularEcommerceSchema
  // orders: ordersTable, // REMOVE - now in newModularEcommerceSchema

  helpdeskArticles: defineTable({
    title: v.string(),
    slug: v.string(),
    category: v.string(),
    summary: v.string(),
    content: v.string(),
    author: v.id("users"),
    authorName: v.string(),
    published: v.boolean(),
    featured: v.boolean(),
    lastUpdated: v.number(),
    views: v.number(),
    tags: v.array(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_author", ["author"])
    .index("by_featured", ["featured"])
    .searchIndex("search_title", { searchField: "title" })
    .searchIndex("search_content", { searchField: "content" }),

  // Add execution_events table
  execution_events: defineTable({
    executionId: v.id("scenario_executions"),
    scenarioId: v.id("scenarios"),
    timestamp: v.number(),
    eventType: v.string(),
    nodeId: v.optional(v.id("nodes")),
    details: v.optional(v.any()),
  })
    .index("by_execution", ["executionId"])
    .index("by_scenario", ["scenarioId"])
    .index("by_node", ["nodeId"])
    .index("by_event_type", ["eventType"]),

  // Add execution_checkpoints table
  execution_checkpoints: defineTable({
    executionId: v.id("scenario_executions"),
    scenarioId: v.id("scenarios"),
    checkpoint: v.object({
      completedNodes: v.array(v.id("nodes")),
      currentNodeId: v.optional(v.id("nodes")),
      nodeOutputs: v.object({}),
      timestamp: v.number(),
      metadata: v.optional(v.object({})),
    }),
    createdAt: v.number(),
  })
    .index("by_execution", ["executionId"])
    .index("by_scenario", ["scenarioId"])
    .index("by_created", ["createdAt"]),
});
