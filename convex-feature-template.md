# Convex Feature Module Template

## Overview

This template defines the standard folder structure for all Convex feature modules. It follows Convex best practices and ensures consistency across the codebase.

## Target Folder Structure

```
feature-name/
├── queries.ts           # All read operations (get*, list*, count*, search*)
├── mutations.ts         # All write operations (create*, update*, delete*, mark*)
├── helpers.ts           # Shared utility functions (optional)
└── schema.ts            # Table definitions and validators
```

## File Templates

### 1. `queries.ts` Template

```typescript
/**
 * [Feature Name] Queries
 *
 * Contains all read operations for the [feature name] feature.
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
 * Get a single [entity] by ID
 */
export const get[Entity]ById = query({
  args: {
    id: v.id("[tableName]")
  },
  returns: v.union(
    v.null(),
    v.id("[tableName]")
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * List all [entities] with optional pagination
 */
export const list[Entities] = query({
  args: {
    paginationOpts: v.optional(paginationOptsValidator),
  },
  returns: v.array(v.id("[tableName]")),
  handler: async (ctx, args) => {
    const query = ctx.db.query("[tableName]");

    if (args.paginationOpts) {
      return await query.paginate(args.paginationOpts);
    }

    return await query.collect();
  },
});

/**
 * Count total [entities]
 */
export const count[Entities] = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const items = await ctx.db.query("[tableName]").collect();
    return items.length;
  },
});
```

### 2. `mutations.ts` Template

```typescript
/**
 * [Feature Name] Mutations
 *
 * Contains all write operations for the [feature name] feature.
 */
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Create a new [entity]
 */
export const create[Entity] = mutation({
  args: {
    // Define required fields based on schema
    name: v.string(),
    // Add other required fields
  },
  returns: v.id("[tableName]"),
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("[tableName]", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing [entity]
 */
export const update[Entity] = mutation({
  args: {
    id: v.id("[tableName]"),
    // Define optional update fields
    name: v.optional(v.string()),
    // Add other updateable fields
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
 * Delete an [entity]
 */
export const delete[Entity] = mutation({
  args: {
    id: v.id("[tableName]")
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
```

### 3. `helpers.ts` Template (Optional)

```typescript
/**
 * [Feature Name] Helpers
 *
 * Shared utility functions for the [feature name] feature.
 */
import { Doc, Id } from "../_generated/dataModel";

/**
 * Format [entity] for display
 */
export function format[Entity](entity: Doc<"[tableName]">): string {
  // Add formatting logic
  return entity.name || "Unnamed [Entity]";
}

/**
 * Validate [entity] data
 */
export function validate[Entity]Data(data: Partial<Doc<"[tableName]">>): boolean {
  // Add validation logic
  return data.name != null && data.name.length > 0;
}

/**
 * Helper function to [specific purpose]
 */
export function [helperFunction](...args: unknown[]): unknown {
  // Add helper logic
  return;
}
```

### 4. `schema.ts` Template

```typescript
/**
 * [Feature Name] Schema
 *
 * Table definitions for the [feature name] feature.
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * [Entity] table schema
 */
export const [tableName]Table = defineTable({
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
  [tableName]: [tableName]Table,
};
```

## Implementation Guidelines

### 1. **File Organization Rules**

- **queries.ts**: Only read operations (query functions)
- **mutations.ts**: Only write operations (mutation functions)
- **helpers.ts**: Pure functions, no database access
- **schema.ts**: Only table definitions and indexes

### 2. **Naming Conventions**

#### Query Functions

- `get[Entity]ById` - Single record retrieval
- `list[Entities]` - Multiple record retrieval
- `count[Entities]` - Record counting
- `search[Entities]` - Full-text search

#### Mutation Functions

- `create[Entity]` - Record creation
- `update[Entity]` - Record modification
- `delete[Entity]` - Record deletion
- `mark[Entity]As[State]` - Status changes

### 3. **TypeScript Best Practices**

- Always use proper return type validators
- Import types from `_generated/dataModel`
- Use shared validators from `shared/validators.ts`
- Avoid 'any' types - use specific Convex validators

### 4. **Schema Design Patterns**

#### Standard Fields (Include in all tables)

```typescript
createdAt: v.number(),
updatedAt: v.number(),
```

#### Common Optional Fields

```typescript
isActive: v.optional(v.boolean()),
userId: v.optional(v.id("users")),
organizationId: v.optional(v.id("organizations")),
```

#### Standard Indexes

```typescript
.index("by_user", ["userId"])
.index("by_organization", ["organizationId"])
.index("by_creation_time", ["createdAt"])
```

### 5. **API Path Conventions**

After refactoring, all features will use this pattern:

```typescript
api.[featureName].queries.[functionName]
api.[featureName].mutations.[functionName]
```

Examples:

```typescript
api.users.queries.getUserById;
api.users.mutations.createUser;
api.ecommerce.queries.listProducts;
api.ecommerce.mutations.updateProduct;
```

## Migration Checklist

When converting an existing feature to this template:

- [ ] **Backup existing files** (.bak extension)
- [ ] **Create new folder structure** (queries.ts, mutations.ts, helpers.ts, schema.ts)
- [ ] **Move query functions** to queries.ts
- [ ] **Move mutation functions** to mutations.ts
- [ ] **Move utility functions** to helpers.ts
- [ ] **Consolidate schema definitions** into schema.ts
- [ ] **Update function signatures** with proper validators
- [ ] **Add proper return types** for all functions
- [ ] **Update imports** throughout the codebase
- [ ] **Test compilation** and fix TypeScript errors
- [ ] **Update API calls** in frontend code
- [ ] **Verify functionality** with comprehensive testing

## Template Usage Script

To create a new feature using this template:

```bash
# Create feature folder
mkdir apps/portal/convex/[feature-name]

# Generate template files (replace [FEATURE_NAME] and [TABLE_NAME])
# This would be automated with a script
```

## Benefits of This Structure

1. **Consistency**: All features follow the same pattern
2. **Predictability**: Developers know where to find specific functions
3. **Type Safety**: Proper TypeScript integration with Convex
4. **Maintainability**: Clear separation of concerns
5. **Scalability**: Easy to add new features following the pattern
6. **Documentation**: Self-documenting structure
7. **Testing**: Easy to test individual components

## Next Steps

1. Use this template for new features
2. Migrate existing features one by one
3. Update main schema.ts to import from feature schemas
4. Update API documentation to reflect new paths
5. Create automated tools for template generation
