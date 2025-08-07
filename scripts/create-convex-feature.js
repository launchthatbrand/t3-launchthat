#!/usr/bin/env node

/**
 * Convex Feature Generator Script
 *
 * Generates a new Convex feature module using the standardized template.
 *
 * Usage: node scripts/create-convex-feature.js <feature-name> <entity-name> [table-name]
 *
 * Example: node scripts/create-convex-feature.js ecommerce Product products
 */

const fs = require("fs");
const path = require("path");

// Get command line arguments
const [, , featureName, entityName, tableName] = process.argv;

if (!featureName || !entityName) {
  console.error(
    "Usage: node scripts/create-convex-feature.js <feature-name> <entity-name> [table-name]",
  );
  console.error(
    "Example: node scripts/create-convex-feature.js ecommerce Product products",
  );
  process.exit(1);
}

// Derive names
const finalTableName = tableName || `${featureName.toLowerCase()}`;
const capitalizedFeature =
  featureName.charAt(0).toUpperCase() + featureName.slice(1);
const capitalizedEntity =
  entityName.charAt(0).toUpperCase() + entityName.slice(1);
const pluralEntity = entityName.endsWith("s") ? entityName : `${entityName}s`;

// Template paths
const convexPath = path.join(process.cwd(), "apps/portal/convex");
const featurePath = path.join(convexPath, featureName);

// Create feature directory
if (!fs.existsSync(featurePath)) {
  fs.mkdirSync(featurePath, { recursive: true });
  console.log(`✅ Created directory: ${featurePath}`);
} else {
  console.log(`⚠️  Directory already exists: ${featurePath}`);
}

// Template files
const templates = {
  "queries.ts": `/**
 * ${capitalizedFeature} Queries
 * 
 * Contains all read operations for the ${featureName} feature.
 */
import { query } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

// Import shared validators
import { 
  paginationOptsValidator,
  PaginationOpts 
} from "../shared/validators";

/**
 * Get a single ${entityName.toLowerCase()} by ID
 */
export const get${capitalizedEntity}ById = query({
  args: { 
    id: v.id("${finalTableName}") 
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("${finalTableName}"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
      userId: v.optional(v.id("users")),
      organizationId: v.optional(v.id("organizations")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * List all ${pluralEntity.toLowerCase()} with optional pagination
 */
export const list${pluralEntity} = query({
  args: {
    paginationOpts: v.optional(paginationOptsValidator),
  },
  returns: v.array(v.object({
    _id: v.id("${finalTableName}"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    userId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const query = ctx.db.query("${finalTableName}");
    
    if (args.paginationOpts) {
      return await query.paginate(args.paginationOpts);
    }
    
    return await query.collect();
  },
});

/**
 * Count total ${pluralEntity.toLowerCase()}
 */
export const count${pluralEntity} = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const items = await ctx.db.query("${finalTableName}").collect();
    return items.length;
  },
});`,

  "mutations.ts": `/**
 * ${capitalizedFeature} Mutations
 * 
 * Contains all write operations for the ${featureName} feature.
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Create a new ${entityName.toLowerCase()}
 */
export const create${capitalizedEntity} = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    userId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.id("${finalTableName}"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("${finalTableName}", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing ${entityName.toLowerCase()}
 */
export const update${capitalizedEntity} = mutation({
  args: {
    id: v.id("${finalTableName}"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return null;
  },
});

/**
 * Delete a ${entityName.toLowerCase()}
 */
export const delete${capitalizedEntity} = mutation({
  args: { 
    id: v.id("${finalTableName}") 
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});`,

  "helpers.ts": `/**
 * ${capitalizedFeature} Helpers
 * 
 * Shared utility functions for the ${featureName} feature.
 */
import { Doc, Id } from "../_generated/dataModel";

/**
 * Format ${entityName.toLowerCase()} for display
 */
export function format${capitalizedEntity}(entity: Doc<"${finalTableName}">): string {
  return entity.name || "Unnamed ${capitalizedEntity}";
}

/**
 * Validate ${entityName.toLowerCase()} data
 */
export function validate${capitalizedEntity}Data(data: Partial<Doc<"${finalTableName}">>): boolean {
  return data.name != null && data.name.length > 0;
}

/**
 * Check if ${entityName.toLowerCase()} is active
 */
export function is${capitalizedEntity}Active(entity: Doc<"${finalTableName}">): boolean {
  return entity.isActive !== false; // Default to true if not specified
}`,

  "schema.ts": `/**
 * ${capitalizedFeature} Schema
 * 
 * Table definitions for the ${featureName} feature.
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * ${capitalizedEntity} table schema
 */
export const ${finalTableName}Table = defineTable({
  // Required fields
  name: v.string(),
  
  // Optional fields with proper validators
  description: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  
  // Relationship fields
  userId: v.optional(v.id("users")),
  organizationId: v.optional(v.id("organizations")),
  
  // Timestamps (standard fields)
  createdAt: v.number(),
  updatedAt: v.number(),
})
  // Add indexes for common query patterns
  .index("by_user", ["userId"])
  .index("by_organization", ["organizationId"])
  .index("by_creation_time", ["createdAt"])
  .index("by_name", ["name"]);

// Export for use in main schema.ts
export const schema = {
  ${finalTableName}: ${finalTableName}Table,
};`,
};

// Create files
Object.entries(templates).forEach(([filename, content]) => {
  const filePath = path.join(featurePath, filename);

  if (fs.existsSync(filePath)) {
    console.log(`⚠️  File already exists, skipping: ${filename}`);
  } else {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created file: ${filename}`);
  }
});

// Generate usage instructions
console.log(`
🎉 ${capitalizedFeature} feature module created successfully!

📁 Location: apps/portal/convex/${featureName}/

📋 Next Steps:
1. Add the schema to apps/portal/convex/schema.ts:
   
   import { schema as ${featureName}Schema } from "./${featureName}/schema";
   
   export default defineSchema({
     ...${featureName}Schema,
     // ... other schemas
   });

2. Update API calls in your frontend code:
   
   api.${featureName}.queries.get${capitalizedEntity}ById
   api.${featureName}.mutations.create${capitalizedEntity}

3. Customize the generated files based on your specific requirements
4. Add additional query/mutation functions as needed
5. Test the new feature module

🔗 API Paths Generated:
   - api.${featureName}.queries.get${capitalizedEntity}ById
   - api.${featureName}.queries.list${pluralEntity}
   - api.${featureName}.queries.count${pluralEntity}
   - api.${featureName}.mutations.create${capitalizedEntity}
   - api.${featureName}.mutations.update${capitalizedEntity}
   - api.${featureName}.mutations.delete${capitalizedEntity}
`);
