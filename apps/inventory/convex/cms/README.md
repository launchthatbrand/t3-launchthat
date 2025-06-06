# Content Management System (CMS) Module

This module provides functionality for managing content in the application, including posts and potentially other content types.

## Directory Structure

```
cms/
├── lib/                  # Utility functions
│   ├── index.ts          # Library exports
│   └── slugify.ts        # URL slug generation utilities
├── schema/               # Schema definitions
│   ├── index.ts          # Schema exports
│   └── postsSchema.ts    # Posts schema definition
├── index.ts              # Main module exports
├── mutations.ts          # Mutation functions (create, update, delete)
├── queries.ts            # Query functions (get, list, search)
└── README.md             # This file
```

## Features

- **Content Management**: Create, read, update, and delete posts
- **Content Discovery**: Search, filter, and paginate through content
- **Content Publishing**: Toggle published status for content visibility
- **URL Management**: Automatic generation of URL-friendly slugs

## API Reference

### Queries

#### `getAllPosts`

Get all posts with filtering and pagination support.

```typescript
const result = await client.query(api.cms.getAllPosts, {
  paginationOpts: { numItems: 10, cursor: "..." },
  filters: {
    published: true,
    authorId: "...",
    tags: ["news", "technology"],
  },
});
```

#### `getPostById`

Get a specific post by its ID.

```typescript
const post = await client.query(api.cms.getPostById, { id: "..." });
```

#### `getPostBySlug`

Get a specific post by its slug.

```typescript
const post = await client.query(api.cms.getPostBySlug, { slug: "my-post" });
```

#### `searchPosts`

Search for posts by title, content, or excerpt.

```typescript
const results = await client.query(api.cms.searchPosts, {
  searchTerm: "keyword",
  paginationOpts: { numItems: 10 },
});
```

#### `getPostTags`

Get all unique tags used across posts.

```typescript
const tags = await client.query(api.cms.getPostTags);
```

### Mutations

#### `createPost`

Create a new post.

```typescript
const { postId, slug } = await client.mutation(api.cms.createPost, {
  title: "My New Post",
  content: "This is the content...",
  excerpt: "A short description",
  tags: ["news", "featured"],
  published: false,
  featuredImageUrl: "https://...",
});
```

#### `updatePost`

Update an existing post.

```typescript
const result = await client.mutation(api.cms.updatePost, {
  id: "...",
  title: "Updated Title",
  content: "Updated content...",
});
```

#### `deletePost`

Delete a post.

```typescript
const result = await client.mutation(api.cms.deletePost, { id: "..." });
```

#### `togglePublishedStatus`

Toggle the published status of a post.

```typescript
const { published } = await client.mutation(api.cms.togglePublishedStatus, {
  id: "...",
});
```

### Utility Functions

#### `slugify`

Generate a URL-friendly slug from a string.

```typescript
import { slugify } from "@/convex/cms/lib/slugify";

const slug = slugify("My Post Title"); // "my-post-title"
```

## Schema

The posts schema includes the following fields:

- `title` (string, required): Post title
- `content` (string, required): Post content
- `authorId` (Id<"users">, optional): User ID of the author
- `createdAt` (number, required): Creation timestamp
- `updatedAt` (number, optional): Last update timestamp
- `published` (boolean, optional): Whether the post is published
- `slug` (string, optional): URL-friendly slug
- `tags` (string[], optional): Tags for categorization
- `excerpt` (string, optional): Short description
- `featuredImageUrl` (string, optional): URL to a featured image

## Error Handling

All functions include proper error handling with specific error codes and messages:

- `unauthorized`: User is not authenticated
- `not_found`: Requested resource doesn't exist
- `forbidden`: User doesn't have permission
- `conflict`: Resource conflict (e.g., duplicate slug)

## Authentication & Authorization

- All mutations require authentication
- Users can only modify their own posts unless they have admin permissions
- Reading published posts is allowed for all users
- Reading unpublished posts is restricted to the author

## Performance Considerations

- Queries use indexes for efficient lookups
- Results are paginated to prevent large data transfers
- Text search is implemented efficiently
