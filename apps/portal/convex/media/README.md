# Convex Media Upload System

This module provides a comprehensive file upload system for Convex, following the [Convex file storage documentation](https://docs.convex.dev/file-storage/upload-files). It supports both Convex storage and external URLs, with integration helpers for other post types.

## Overview

The media system consists of:

1. **Core Upload Logic** - Generate upload URLs and save media metadata
2. **Media Management** - CRUD operations for media items
3. **Integration Helpers** - Functions to link media with other content types
4. **HTTP Actions** - Direct upload endpoints and webhook support

## Quick Start

### 1. Generate Upload URL (Client-side)

```typescript
// Get upload URL
const uploadUrl = await convex.mutation(api.media.generateUploadUrl, {});

// Upload file
const result = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});

const { storageId } = await result.json();
```

### 2. Save Media Metadata

```typescript
// Save media item with metadata
const mediaItem = await convex.mutation(api.media.saveMedia, {
  storageId,
  title: "My Image",
  alt: "Description for accessibility",
  caption: "Image caption",
  categories: ["photos", "portfolio"],
  status: "published",
});
```

### 3. Link to Post Types

```typescript
// For CMS Posts
await convex.mutation(api.cms.createPost, {
  title: "My Post",
  content: "Post content...",
  featuredImageId: mediaItem.mediaItemId, // Link to media item
  // ... other fields
});

// For Products
await convex.mutation(api.ecommerce.products.media.addProductMedia, {
  productId: "productId",
  mediaItems: [
    {
      mediaItemId: mediaItem.mediaItemId,
      alt: "Product image",
      position: 0,
      isPrimary: true,
    },
  ],
});
```

## Core Functions

### Upload Functions

#### `generateUploadUrl()`

Generates a signed upload URL for client-side file uploads.

```typescript
const uploadUrl = await convex.mutation(api.media.generateUploadUrl, {});
```

#### `saveMedia(args)`

Saves media metadata after successful upload.

```typescript
const media = await convex.mutation(api.media.saveMedia, {
  storageId: "storage_id", // Required if using Convex storage
  externalUrl: "https://...", // Alternative to storageId
  title: "Optional title",
  alt: "Alt text for accessibility",
  caption: "Image caption",
  categories: ["category1", "category2"],
  status: "published", // or "draft"
});
```

### Query Functions

#### `getMediaItem(id)`

Get a single media item with URL.

```typescript
const media = await convex.query(api.media.getMediaItem, {
  id: mediaItemId,
});
```

#### `listMedia(options)`

List media with filtering and pagination.

```typescript
const media = await convex.query(api.media.listMedia, {
  limit: 20,
  status: "published",
  category: "photos",
  search: "keyword",
});
```

#### `listMediaItemsWithUrl(options)`

List media items with resolved URLs.

```typescript
const mediaWithUrls = await convex.query(api.media.listMediaItemsWithUrl, {
  limit: 20,
  status: "published",
});
```

### Management Functions

#### `updateMedia(id, updates)`

Update media metadata.

```typescript
await convex.mutation(api.media.updateMedia, {
  id: mediaItemId,
  title: "Updated title",
  alt: "Updated alt text",
});
```

#### `deleteMedia(id)`

Delete a media item and its associated storage file.

```typescript
await convex.mutation(api.media.deleteMedia, {
  id: mediaItemId,
});
```

## Integration with Other Post Types

### CMS Posts

Posts support both `featuredImageUrl` (string) and `featuredImageId` (media item reference):

```typescript
// Create post with media
const post = await convex.mutation(api.cms.createPost, {
  title: "My Post",
  content: "Content...",
  featuredImageId: mediaItemId, // Links to media item
  // ... other fields
});

// Or with direct URL (backward compatibility)
const post = await convex.mutation(api.cms.createPost, {
  title: "My Post",
  content: "Content...",
  featuredImageUrl: "https://example.com/image.jpg",
  // ... other fields
});
```

### LMS Content (Lessons/Topics)

LMS content uses a `featuredMedia` field that supports both Convex media and Vimeo:

```typescript
// For Convex media
const lesson = await convex.mutation(api.lms.createLesson, {
  title: "My Lesson",
  featuredMedia: {
    type: "convex",
    mediaItemId: mediaItemId,
  },
  // ... other fields
});

// For Vimeo media
const lesson = await convex.mutation(api.lms.createLesson, {
  title: "My Lesson",
  featuredMedia: {
    type: "vimeo",
    vimeoId: "123456789",
    vimeoUrl: "https://vimeo.com/123456789",
  },
  // ... other fields
});
```

### Products

Products support both the legacy `images` array and the new `mediaItems` array:

```typescript
// Add media to existing product
await convex.mutation(api.ecommerce.products.media.addProductMedia, {
  productId: productId,
  mediaItems: [
    {
      mediaItemId: mediaItemId,
      alt: "Product image",
      position: 0,
      isPrimary: true,
    },
  ],
});

// Create product with media
const product = await convex.mutation(
  api.ecommerce.products.media.createProductWithMedia,
  {
    name: "My Product",
    price: 29.99,
    storageIds: [storageId1, storageId2],
    mediaMetadata: [
      { title: "Main image", alt: "Product front view", isPrimary: true },
      { title: "Side view", alt: "Product side view" },
    ],
    // ... other product fields
  },
);
```

### Downloads

Downloads use `featuredImageId` for thumbnail images:

```typescript
const download = await convex.mutation(api.downloads.create, {
  title: "My Download",
  storageId: fileStorageId,
  featuredImageId: thumbnailStorageId, // Links to storage directly
  // ... other fields
});
```

## Integration Helper Functions

### `createMediaForPost()`

Create media item and return both ID and URL:

```typescript
const result = await convex.mutation(api.media.createMediaForPost, {
  storageId: storageId,
  title: "Image title",
  alt: "Alt text",
  status: "published",
});
// Returns: { mediaItemId, url }
```

### `createLMSFeaturedMedia()`

Create media in the format expected by LMS content:

```typescript
const featuredMedia = await convex.mutation(api.media.createLMSFeaturedMedia, {
  storageId: storageId,
  title: "Video title",
  alt: "Video description",
});
// Returns: { type: "convex", mediaItemId }
```

### `createProductImages()`

Convert media items to product images format:

```typescript
const images = await convex.mutation(api.media.createProductImages, {
  mediaItems: [
    { mediaItemId: id1, alt: "Main image", isPrimary: true },
    { mediaItemId: id2, alt: "Side view" },
  ],
});
// Returns: [{ url, alt, isPrimary }, ...]
```

### `bulkCreateMedia()`

Create multiple media items at once:

```typescript
const results = await convex.mutation(api.media.bulkCreateMedia, {
  items: [
    { storageId: id1, title: "Image 1" },
    { storageId: id2, title: "Image 2" },
  ],
});
// Returns: [{ mediaItemId, url }, ...]
```

## HTTP Actions

### Direct Upload Endpoint

```typescript
// POST /uploadMedia?title=MyImage&alt=Description
const response = await fetch("/api/uploadMedia", {
  method: "POST",
  body: fileBlob,
  headers: {
    "Content-Type": file.type,
  },
});
```

### Webhook Support

```typescript
// POST /createMediaFromWebhook
await fetch("/api/createMediaFromWebhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    externalUrl: "https://example.com/image.jpg",
    title: "Webhook Image",
    alt: "From external source",
  }),
});
```

## Schema Structure

### MediaItems Table

```typescript
{
  // Storage reference (for Convex files)
  storageId: v.optional(v.id("_storage")),

  // External URL (for external files)
  externalUrl: v.optional(v.string()),

  // Metadata
  title: v.optional(v.string()),
  caption: v.optional(v.string()),
  alt: v.optional(v.string()),

  // Organization
  categories: v.optional(v.array(v.string())),
  tags: v.optional(v.array(v.string())),

  // Status and workflow
  status: v.optional(v.union(v.literal("draft"), v.literal("published"))),

  // File information (auto-populated for Convex storage)
  fileType: v.optional(v.string()),
  fileSize: v.optional(v.number()),

  // Timestamps
  uploadedAt: v.optional(v.number()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number())
}
```

## Best Practices

### 1. Always Set Alt Text

For accessibility, always provide meaningful alt text:

```typescript
await convex.mutation(api.media.saveMedia, {
  storageId,
  title: "Company logo",
  alt: "Acme Corp logo - red circle with white text", // Descriptive alt text
});
```

### 2. Use Categories for Organization

Organize media with consistent categories:

```typescript
const categories = ["photos", "marketing", "hero-images"];
```

### 3. Handle Upload Errors

Always handle upload failures gracefully:

```typescript
try {
  const uploadUrl = await convex.mutation(api.media.generateUploadUrl, {});
  const response = await fetch(uploadUrl, { method: "POST", body: file });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  const { storageId } = await response.json();
  await convex.mutation(api.media.saveMedia, { storageId, title, alt });
} catch (error) {
  console.error("Upload error:", error);
  // Handle error appropriately
}
```

### 4. Use Integration Helpers

Prefer integration helpers over manual URL generation:

```typescript
// Good: Uses integration helper
const media = await convex.mutation(api.media.createMediaForPost, {
  storageId,
  title,
  alt,
});

// Then use mediaItemId for post
await convex.mutation(api.cms.createPost, {
  featuredImageId: media.mediaItemId,
});
```

## Migration Guide

### From Direct URLs to Media Items

If you currently use direct URLs, you can migrate to media items:

```typescript
// Old way
const post = {
  featuredImageUrl: "https://example.com/image.jpg",
};

// New way - create media item first
const media = await convex.mutation(api.media.saveMedia, {
  externalUrl: "https://example.com/image.jpg",
  title: "Featured image",
  alt: "Description",
});

const post = {
  featuredImageId: media.mediaItemId,
  featuredImageUrl: "https://example.com/image.jpg", // Keep for backward compatibility
};
```

### From Storage IDs to Media Items

```typescript
// Old way - direct storage reference
const download = {
  featuredImageId: storageId, // Direct storage ID
};

// New way - create media item
const media = await convex.mutation(api.media.saveMedia, {
  storageId,
  title: "Download thumbnail",
  alt: "File preview",
});

const download = {
  featuredImageId: media.mediaItemId, // Reference to media item
};
```

This system provides a centralized, consistent way to handle all media uploads across your application while maintaining backward compatibility with existing patterns.
