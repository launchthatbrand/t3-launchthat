/**
 * Built-in Content Types Initialization
 *
 * This module provides functions to initialize the built-in content types
 * for the CMS, such as Downloads, Groups, Events, Blog Posts, Products, Courses, etc.
 */
import { MutationCtx } from "../../_generated/server";
import { ContentTypeField } from "../lib/contentTypes";

/**
 * Initialize all built-in content types
 */
export async function initializeBuiltInContentTypes(ctx: MutationCtx) {
  // Create all built-in content types
  await initializeDownloadContentType(ctx);
  await initializeGroupContentType(ctx);
  await initializeEventContentType(ctx);
  await initializeBlogPostContentType(ctx);
  await initializeProductContentType(ctx);
  await initializeCourseContentType(ctx);
  await initializeLessonContentType(ctx);
  await initializeTopicContentType(ctx);
  await initializeCheckoutContentType(ctx);
}

/**
 * Initialize the Downloads content type
 */
export async function initializeDownloadContentType(ctx: MutationCtx) {
  return await createBuiltInContentType(ctx, {
    name: "Downloads",
    slug: "downloads",
    description: "Downloadable files and resources",
    fields: [
      {
        name: "Title",
        key: "title",
        type: "text",
        required: true,
        description: "The title of the download",
        order: 0,
      },
      {
        name: "Description",
        key: "description",
        type: "richText",
        required: false,
        description: "A description of the download",
        order: 1,
      },
      {
        name: "File",
        key: "file",
        type: "file",
        required: true,
        description: "The downloadable file",
        order: 2,
      },
      {
        name: "Category",
        key: "category",
        type: "select",
        required: false,
        description: "The category of the download",
        options: {
          options: [
            { label: "Document", value: "document" },
            { label: "Image", value: "image" },
            { label: "Video", value: "video" },
            { label: "Audio", value: "audio" },
            { label: "Software", value: "software" },
            { label: "Other", value: "other" },
          ],
        },
        order: 3,
      },
      {
        name: "Featured",
        key: "featured",
        type: "boolean",
        required: false,
        description: "Whether this download is featured",
        order: 4,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        description: "The publication status of the download",
        options: {
          options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
            { label: "Archived", value: "archived" },
          ],
        },
        defaultValue: "draft",
        order: 5,
      },
    ],
  });
}

/**
 * Initialize the Group content type
 */
export async function initializeGroupContentType(ctx: MutationCtx) {
  return await createBuiltInContentType(ctx, {
    name: "Groups",
    slug: "groups",
    description: "User groups and communities",
    fields: [
      {
        name: "Name",
        key: "name",
        type: "text",
        required: true,
        description: "The name of the group",
        order: 0,
      },
      {
        name: "Description",
        key: "description",
        type: "richText",
        required: false,
        description: "A description of the group",
        order: 1,
      },
      {
        name: "Image",
        key: "image",
        type: "image",
        required: false,
        description: "The group's profile image",
        order: 2,
      },
      {
        name: "Privacy",
        key: "privacy",
        type: "select",
        required: true,
        description: "The privacy setting for the group",
        options: {
          options: [
            { label: "Public", value: "public" },
            { label: "Private", value: "private" },
            { label: "Secret", value: "secret" },
          ],
        },
        defaultValue: "public",
        order: 3,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        description: "The status of the group",
        options: {
          options: [
            { label: "Active", value: "active" },
            { label: "Archived", value: "archived" },
          ],
        },
        defaultValue: "active",
        order: 4,
      },
      {
        name: "Tags",
        key: "tags",
        type: "multiSelect",
        required: false,
        description: "Tags for categorizing the group",
        order: 5,
      },
    ],
  });
}

/**
 * Initialize the Event content type
 */
export async function initializeEventContentType(ctx: MutationCtx) {
  return await createBuiltInContentType(ctx, {
    name: "Events",
    slug: "events",
    description: "Calendar events and appointments",
    fields: [
      {
        name: "Title",
        key: "title",
        type: "text",
        required: true,
        description: "The title of the event",
        order: 0,
      },
      {
        name: "Description",
        key: "description",
        type: "richText",
        required: false,
        description: "A description of the event",
        order: 1,
      },
      {
        name: "Start Date",
        key: "startDate",
        type: "datetime",
        required: true,
        description: "The start date and time of the event",
        order: 2,
      },
      {
        name: "End Date",
        key: "endDate",
        type: "datetime",
        required: true,
        description: "The end date and time of the event",
        order: 3,
      },
      {
        name: "All Day",
        key: "allDay",
        type: "boolean",
        required: false,
        description: "Whether this is an all-day event",
        order: 4,
      },
      {
        name: "Location",
        key: "location",
        type: "text",
        required: false,
        description: "The location of the event",
        order: 5,
      },
      {
        name: "Category",
        key: "category",
        type: "select",
        required: false,
        description: "The category of the event",
        options: {
          options: [
            { label: "Meeting", value: "meeting" },
            { label: "Conference", value: "conference" },
            { label: "Workshop", value: "workshop" },
            { label: "Social", value: "social" },
            { label: "Other", value: "other" },
          ],
        },
        order: 6,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        description: "The status of the event",
        options: {
          options: [
            { label: "Scheduled", value: "scheduled" },
            { label: "Cancelled", value: "cancelled" },
            { label: "Postponed", value: "postponed" },
          ],
        },
        defaultValue: "scheduled",
        order: 7,
      },
    ],
  });
}

/**
 * Initialize the Blog Post content type
 */
export async function initializeBlogPostContentType(ctx: MutationCtx) {
  return await createBuiltInContentType(ctx, {
    name: "Blog Posts",
    slug: "blog-posts",
    description: "Blog articles and posts",
    fields: [
      {
        name: "Title",
        key: "title",
        type: "text",
        required: true,
        description: "The title of the blog post",
        order: 0,
      },
      {
        name: "Content",
        key: "content",
        type: "richText",
        required: true,
        description: "The content of the blog post",
        order: 1,
      },
      {
        name: "Excerpt",
        key: "excerpt",
        type: "textarea",
        required: false,
        description: "A short summary of the blog post",
        order: 2,
      },
      {
        name: "Featured Image",
        key: "featuredImage",
        type: "image",
        required: false,
        description: "The featured image for the blog post",
        order: 3,
      },
      {
        name: "Author",
        key: "author",
        type: "user",
        required: false,
        description: "The author of the blog post",
        order: 4,
      },
      {
        name: "Categories",
        key: "categories",
        type: "multiSelect",
        required: false,
        description: "Categories for the blog post",
        order: 5,
      },
      {
        name: "Tags",
        key: "tags",
        type: "multiSelect",
        required: false,
        description: "Tags for the blog post",
        order: 6,
      },
      {
        name: "Publication Date",
        key: "publicationDate",
        type: "datetime",
        required: false,
        description: "The date when the blog post was published",
        order: 7,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        description: "The publication status of the blog post",
        options: {
          options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
            { label: "Scheduled", value: "scheduled" },
            { label: "Archived", value: "archived" },
          ],
        },
        defaultValue: "draft",
        order: 8,
      },
    ],
  });
}

/**
 * Initialize the Product content type
 */
export async function initializeProductContentType(ctx: MutationCtx) {
  return await createBuiltInContentType(ctx, {
    name: "Products",
    slug: "products",
    description: "E-commerce products and merchandise",
    fields: [
      {
        name: "Name",
        key: "name",
        type: "text",
        required: true,
        description: "The name of the product",
        order: 0,
      },
      {
        name: "Description",
        key: "description",
        type: "richText",
        required: false,
        description: "A description of the product",
        order: 1,
      },
      {
        name: "Price",
        key: "price",
        type: "number",
        required: true,
        description: "The price of the product",
        order: 2,
      },
      {
        name: "Sale Price",
        key: "salePrice",
        type: "number",
        required: false,
        description: "The sale price of the product (if on sale)",
        order: 3,
      },
      {
        name: "SKU",
        key: "sku",
        type: "text",
        required: false,
        description: "The stock keeping unit for the product",
        order: 4,
      },
      {
        name: "Images",
        key: "images",
        type: "json",
        required: false,
        description: "Images of the product",
        order: 5,
      },
      {
        name: "Categories",
        key: "categories",
        type: "multiSelect",
        required: false,
        description: "Categories for the product",
        order: 6,
      },
      {
        name: "Tags",
        key: "tags",
        type: "multiSelect",
        required: false,
        description: "Tags for the product",
        order: 7,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        description: "The status of the product",
        options: {
          options: [
            { label: "Active", value: "active" },
            { label: "Draft", value: "draft" },
            { label: "Out of Stock", value: "out_of_stock" },
            { label: "Discontinued", value: "discontinued" },
          ],
        },
        defaultValue: "draft",
        order: 8,
      },
      {
        name: "Featured",
        key: "featured",
        type: "boolean",
        required: false,
        description: "Whether this product is featured",
        order: 9,
      },
    ],
  });
}

/**
 * Initialize the Course content type
 */
export async function initializeCourseContentType(ctx: MutationCtx) {
  return await createBuiltInContentType(ctx, {
    name: "Courses",
    slug: "courses",
    description: "Educational courses and training programs",
    fields: [
      {
        name: "Title",
        key: "title",
        type: "text",
        required: true,
        description: "The title of the course",
        order: 0,
      },
      {
        name: "Description",
        key: "description",
        type: "richText",
        required: false,
        description: "A description of the course",
        order: 1,
      },
      {
        name: "Instructor",
        key: "instructor",
        type: "user",
        required: false,
        description: "The instructor of the course",
        order: 2,
      },
      {
        name: "Featured Image",
        key: "featuredImage",
        type: "image",
        required: false,
        description: "The featured image for the course",
        order: 3,
      },
      {
        name: "Duration",
        key: "duration",
        type: "text",
        required: false,
        description: "The duration of the course (e.g., '4 weeks')",
        order: 4,
      },
      {
        name: "Level",
        key: "level",
        type: "select",
        required: false,
        description: "The difficulty level of the course",
        options: {
          options: [
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Advanced", value: "advanced" },
            { label: "All Levels", value: "all_levels" },
          ],
        },
        order: 5,
      },
      {
        name: "Price",
        key: "price",
        type: "number",
        required: false,
        description: "The price of the course",
        order: 6,
      },
      {
        name: "Categories",
        key: "categories",
        type: "multiSelect",
        required: false,
        description: "Categories for the course",
        order: 7,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        description: "The status of the course",
        options: {
          options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
            { label: "Archived", value: "archived" },
          ],
        },
        defaultValue: "draft",
        order: 8,
      },
      {
        name: "Enrollment Status",
        key: "enrollmentStatus",
        type: "select",
        required: false,
        description: "The enrollment status of the course",
        options: {
          options: [
            { label: "Open", value: "open" },
            { label: "Closed", value: "closed" },
            { label: "Coming Soon", value: "coming_soon" },
          ],
        },
        order: 9,
      },
    ],
  });
}

/**
 * Initialize the Lesson content type
 */
export async function initializeLessonContentType(ctx: MutationCtx) {
  return await createBuiltInContentType(ctx, {
    name: "Lessons",
    slug: "lessons",
    description: "Individual lessons within courses",
    fields: [
      {
        name: "Title",
        key: "title",
        type: "text",
        required: true,
        description: "The title of the lesson",
        order: 0,
      },
      {
        name: "Content",
        key: "content",
        type: "richText",
        required: true,
        description: "The content of the lesson",
        order: 1,
      },
      {
        name: "Course",
        key: "course",
        type: "relation",
        required: true,
        description: "The course this lesson belongs to",
        order: 2,
      },
      {
        name: "Order",
        key: "order",
        type: "number",
        required: false,
        description: "The order of the lesson within the course",
        order: 3,
      },
      {
        name: "Duration",
        key: "duration",
        type: "number",
        required: false,
        description: "The duration of the lesson in minutes",
        order: 4,
      },
      {
        name: "Video URL",
        key: "videoUrl",
        type: "url",
        required: false,
        description: "The URL of the lesson video",
        order: 5,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        description: "The status of the lesson",
        options: {
          options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
            { label: "Archived", value: "archived" },
          ],
        },
        defaultValue: "draft",
        order: 6,
      },
    ],
  });
}

/**
 * Initialize the Topic content type
 */
export async function initializeTopicContentType(ctx: MutationCtx) {
  return await createBuiltInContentType(ctx, {
    name: "Topics",
    slug: "topics",
    description: "Topics or modules within courses",
    fields: [
      {
        name: "Title",
        key: "title",
        type: "text",
        required: true,
        description: "The title of the topic",
        order: 0,
      },
      {
        name: "Description",
        key: "description",
        type: "richText",
        required: false,
        description: "A description of the topic",
        order: 1,
      },
      {
        name: "Course",
        key: "course",
        type: "relation",
        required: true,
        description: "The course this topic belongs to",
        order: 2,
      },
      {
        name: "Order",
        key: "order",
        type: "number",
        required: false,
        description: "The order of the topic within the course",
        order: 3,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        description: "The status of the topic",
        options: {
          options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
            { label: "Archived", value: "archived" },
          ],
        },
        defaultValue: "draft",
        order: 4,
      },
    ],
  });
}

/**
 * Initialize the Checkout content type
 */
export async function initializeCheckoutContentType(ctx: MutationCtx) {
  return await createBuiltInContentType(ctx, {
    name: "Checkouts",
    slug: "checkouts",
    description: "Custom checkout configurations with bundled products",
    fields: [
      {
        name: "Title",
        key: "title",
        type: "text",
        required: true,
        description: "The title of the checkout",
        order: 0,
      },
      {
        name: "Slug",
        key: "slug",
        type: "text",
        required: true,
        description:
          "URL-friendly identifier for the checkout (e.g., 'premium-bundle')",
        order: 1,
      },
      {
        name: "Description",
        key: "description",
        type: "richText",
        required: false,
        description: "A description of this checkout configuration",
        order: 2,
      },
      {
        name: "Products",
        key: "products",
        type: "relation",
        required: true,
        description: "Products to include in this checkout",
        options: {
          contentType: "products",
          multiple: true,
        },
        order: 3,
      },
      {
        name: "Collect Email",
        key: "collectEmail",
        type: "boolean",
        required: true,
        description: "Whether to collect customer email",
        defaultValue: true,
        order: 4,
      },
      {
        name: "Collect Name",
        key: "collectName",
        type: "boolean",
        required: true,
        description: "Whether to collect customer name",
        defaultValue: true,
        order: 5,
      },
      {
        name: "Collect Phone",
        key: "collectPhone",
        type: "boolean",
        required: true,
        description: "Whether to collect customer phone number",
        defaultValue: false,
        order: 6,
      },
      {
        name: "Collect Shipping Address",
        key: "collectShippingAddress",
        type: "boolean",
        required: true,
        description: "Whether to collect shipping address",
        defaultValue: false,
        order: 7,
      },
      {
        name: "Collect Billing Address",
        key: "collectBillingAddress",
        type: "boolean",
        required: true,
        description: "Whether to collect billing address",
        defaultValue: false,
        order: 8,
      },
      {
        name: "Allow Coupons",
        key: "allowCoupons",
        type: "boolean",
        required: true,
        description: "Whether to allow coupon codes",
        defaultValue: true,
        order: 9,
      },
      {
        name: "Success URL",
        key: "successUrl",
        type: "text",
        required: false,
        description: "URL to redirect to after successful checkout",
        order: 10,
      },
      {
        name: "Cancel URL",
        key: "cancelUrl",
        type: "text",
        required: false,
        description: "URL to redirect to if checkout is cancelled",
        order: 11,
      },
      {
        name: "Status",
        key: "status",
        type: "select",
        required: true,
        description: "The status of this checkout configuration",
        options: {
          options: [
            { label: "Draft", value: "draft" },
            { label: "Active", value: "active" },
            { label: "Archived", value: "archived" },
          ],
        },
        defaultValue: "draft",
        order: 12,
      },
    ],
  });
}

/**
 * Helper function to create a built-in content type
 */
export async function createBuiltInContentType(
  ctx: MutationCtx,
  {
    name,
    slug,
    description,
    fields,
  }: {
    name: string;
    slug: string;
    description?: string;
    fields: ContentTypeField[];
  },
) {
  // Check if content type already exists
  const existingContentType = await ctx.db
    .query("contentTypes")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (existingContentType) {
    console.log(`Content type '${name}' already exists`);
    return existingContentType._id;
  }

  console.log(`Creating built-in content type: ${name}`);

  // Create the content type
  const timestamp = Date.now();
  const contentTypeId = await ctx.db.insert("contentTypes", {
    name,
    slug,
    description,
    isBuiltIn: true,
    isPublic: true,
    enableVersioning: false,
    enableApi: true,
    includeTimestamps: true,
    fieldCount: fields.length,
    entryCount: 0,
    createdAt: timestamp,
  });

  // Create system fields
  await ctx.db.insert("contentTypeFields", {
    contentTypeId,
    name: "ID",
    key: "_id",
    type: "text",
    required: true,
    isSystem: true,
    isBuiltIn: true,
    description: "Unique identifier",
    order: 0,
    createdAt: timestamp,
  });

  await ctx.db.insert("contentTypeFields", {
    contentTypeId,
    name: "Created At",
    key: "_creationTime",
    type: "datetime",
    required: true,
    isSystem: true,
    isBuiltIn: true,
    description: "Creation timestamp",
    order: 1,
    createdAt: timestamp,
  });

  await ctx.db.insert("contentTypeFields", {
    contentTypeId,
    name: "Last Updated",
    key: "updatedAt",
    type: "datetime",
    required: false,
    isSystem: true,
    isBuiltIn: true,
    description: "Last update timestamp",
    order: 2,
    createdAt: timestamp,
  });

  // Create custom fields
  for (const field of fields) {
    await ctx.db.insert("contentTypeFields", {
      contentTypeId,
      name: field.name,
      key: field.key,
      type: field.type,
      description: field.description,
      required: field.required ?? false,
      searchable: field.searchable ?? false,
      filterable: field.filterable ?? false,
      defaultValue: field.defaultValue,
      validationRules: field.validationRules,
      options: field.options,
      isSystem: false,
      isBuiltIn: true,
      uiConfig: field.uiConfig,
      order: field.order ?? 0,
      createdAt: timestamp,
    });
  }

  return contentTypeId;
}
