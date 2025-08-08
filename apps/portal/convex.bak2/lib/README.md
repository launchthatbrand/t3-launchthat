# Slug Generation System - CENTRALIZED SOLUTION

This utility provides the **single source of truth** for generating unique, URL-friendly slugs for various content types across the entire application, similar to WordPress's `wp_unique_post_slug()`. All slug generation should use this centralized system to ensure consistency.

## Features

- Generate URL-friendly slugs from titles or names
- Ensure slug uniqueness by automatically adding numeric suffixes
- Sanitize user-provided custom slugs
- Check for reserved slugs that shouldn't be used
- Truncate long slugs to stay within safe URL length limits
- Automatically handle common challenges like spaces, special characters, etc.

## Usage Examples

### Basic Usage in Mutations

```typescript
import { generateUniqueSlug, sanitizeSlug } from "../lib/slugs";

// In your mutation handler:
const title = "My New Post Title";
const slug = await generateUniqueSlug(ctx.db, "posts", title);

// Create the entity with the slug
const postId = await ctx.db.insert("posts", {
  title,
  slug,
  // other fields...
});
```

### Handling Custom Slugs

```typescript
// Allow users to provide their own custom slug
export const createPost = mutation({
  args: {
    title: v.string(),
    // other fields...
    customSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { title, customSlug } = args;

    // Generate a unique slug from the title or use a custom slug if provided
    let slug;
    if (customSlug) {
      // Sanitize the custom slug if provided
      const sanitizedSlug = sanitizeSlug(customSlug);
      slug = await generateUniqueSlug(ctx.db, "posts", sanitizedSlug);
    } else {
      // Generate a slug from the title
      slug = await generateUniqueSlug(ctx.db, "posts", title);
    }

    // Create the entity with the slug
    // ...
  },
});
```

## Important Implementation Notes

1. **Schema Requirements**:

   - Make sure your table schema includes a `slug` field and an index for efficient lookups:

   ```typescript
   myTable: defineTable({
     // other fields...
     slug: v.string(),
   }).index("by_slug", ["slug"]);
   ```

2. **Error Handling**:

   - The system gracefully handles cases where tables don't have slug fields or proper indexes.
   - It will log warnings when it can't validate slug uniqueness.

3. **Reserved Slugs**:
   - Use `isReservedSlug()` to check if a slug should be avoided (like 'admin', 'api', etc.)
   - The list of reserved slugs can be customized in the `slugs.ts` file.

## API Reference

### `generateSlug(text: string): string`

Converts any text into a URL-friendly slug by removing special characters, replacing spaces with hyphens, etc.

### `truncateSlug(slug: string, maxLength = 200): string`

Ensures slugs don't exceed the specified maximum length.

### `generateUniqueSlug(db: DatabaseReader, tableName: TableNames, baseSlug: string, entityId?: Id<TableNames>): Promise<string>`

Generates a slug that is guaranteed to be unique in the specified table. If a slug already exists, it adds a numeric suffix.

### `sanitizeSlug(slug: string): string`

Sanitizes a user-provided slug, ensuring it follows all the required formatting rules.

### `isReservedSlug(slug: string): boolean`

Checks if a slug is in the list of reserved words that shouldn't be used as slugs.

## Implemented Across the Application

The centralized slug system is now used throughout the application:

- **Blog Posts**: `convex/cms/mutations.ts` - For creating and updating posts
- **Products**: `convex/ecommerce/products/mutations.ts` - For product catalog items
- **Calendar Events**: `convex/calendar/events/mutations.ts` - For calendar events

## Before vs. After

Before centralization, the application had multiple slug generation systems:

- `convex/cms/lib/slugify.ts` - CMS-specific implementation
- `convex/lib/slugify.ts` - Generic implementation
- Various ad-hoc implementations scattered throughout the codebase

Now, everything has been consolidated into this single system for consistency and maintainability.
