import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define a unified product schema that's compatible with both older and newer code
// Renamed from unifiedProductsTable to productsTable for consistency
export const productsTable = defineTable({
  // Basic product info (from ecommerceSchema)
  name: v.string(),
  description: v.optional(v.string()),
  priceInCents: v.number(), // Maintained for backward compatibility
  isPublished: v.optional(v.boolean()), // Maintained for backward compatibility

  // Course integration (from ecommerceSchema)
  courseIds: v.optional(v.array(v.id("courses"))),

  // Enhanced product info (from ecommerceCategoriesSchema)
  slug: v.string(),
  shortDescription: v.optional(v.string()),

  // Categorization
  primaryCategoryId: v.id("productCategories"), // Main category
  categoryIds: v.array(v.id("productCategories")), // All categories this product belongs to

  // Pricing (enhanced)
  price: v.number(), // Same as priceInCents for consistency
  salePrice: v.optional(v.number()),
  costPrice: v.optional(v.number()),

  // Inventory
  sku: v.string(),
  stockQuantity: v.optional(v.number()),

  // Product type
  isDigital: v.boolean(),
  hasVariants: v.boolean(),

  // Tags and attributes
  tags: v.optional(v.array(v.string())),
  isFeatured: v.boolean(),

  // Tax and shipping
  taxable: v.boolean(),
  taxClass: v.optional(v.string()),
  weight: v.optional(v.number()), // Weight in grams
  dimensions: v.optional(
    v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
      unit: v.string(), // cm, inch, etc.
    }),
  ),

  // Digital product
  downloadFileId: v.optional(v.id("downloads")), // If this is a digital product

  // Media
  images: v.array(
    v.object({
      url: v.string(),
      alt: v.optional(v.string()),
      position: v.optional(v.number()), // For ordering
      isPrimary: v.optional(v.boolean()),
    }),
  ),

  // Status and visibility
  status: v.string(), // e.g., "draft", "published", "archived"
  isVisible: v.boolean(),

  // Variations configuration
  variantAttributes: v.optional(v.array(v.string())), // e.g., ["color", "size"]

  // SEO fields
  metaTitle: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  metaKeywords: v.optional(v.array(v.string())),

  // Related products
  relatedProductIds: v.optional(v.array(v.id("products"))),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Monday.com integration
  mondayItemId: v.optional(v.string()), // ID of the corresponding item in Monday.com
  mondayBoardId: v.optional(v.string()), // ID of the Monday.com board where this item exists
  mondayLastSynced: v.optional(v.number()), // Timestamp of last sync with Monday.com
  mondaySyncStatus: v.optional(v.string()), // Status of the sync: "synced", "pending", "failed"
  mondaySyncError: v.optional(v.string()), // Last error message if sync failed
})
  .index("by_primary_category", ["primaryCategoryId"])
  .index("by_status", ["status"])
  .index("by_visible", ["isVisible"])
  .index("by_featured", ["isFeatured"])
  .index("by_sku", ["sku"])
  .index("by_created", ["createdAt"])
  .index("by_updated", ["updatedAt"])
  .index("by_digital", ["isDigital"])
  // Add back original indexes if they are not covered by the new ones
  .index("by_courseIds", ["courseIds"])
  .index("by_isPublished", ["isPublished"]) // This might be covered by by_status or by_visible
  // Monday.com integration indexes
  .index("by_monday_item", ["mondayItemId"])
  .index("by_monday_sync_status", ["mondaySyncStatus"])
  .index("by_monday_last_synced", ["mondayLastSynced"])
  .searchIndex("search_products_name", {
    searchField: "name",
    filterFields: [
      "status",
      "isVisible",
      "primaryCategoryId",
      "isFeatured",
      "isDigital",
    ],
  })
  .searchIndex("search_products_description", {
    searchField: "description",
    filterFields: [
      "status",
      "isVisible",
      "primaryCategoryId",
      "isFeatured",
      "isDigital",
    ],
  });

// Re-define productVariantsTable if it was part of the old productsSchema.ts
// Based on previous logs, productVariantsTable was defined in the main schema.ts and moved here.
// It was: defineTable({ productId: v.id("products"), attributes: v.any(), stock: v.number() })
export const productVariantsTable = defineTable({
  productId: v.id("products"),
  attributes: v.any(), // e.g., { color: "Red", size: "M" }
  sku: v.optional(v.string()),
  stockQuantity: v.number(),
  price: v.optional(v.number()), // Variant-specific price, overrides main product price if set
  salePrice: v.optional(v.number()),
  weight: v.optional(v.number()),
  images: v.optional(
    v.array(v.object({ url: v.string(), alt: v.optional(v.string()) })),
  ),
  isPublished: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),

  // Monday.com integration
  mondayItemId: v.optional(v.string()), // ID of the corresponding item in Monday.com
  mondayBoardId: v.optional(v.string()), // ID of the Monday.com board where this item exists
  mondayLastSynced: v.optional(v.number()), // Timestamp of last sync with Monday.com
})
  .index("by_product", ["productId"])
  .index("by_sku", ["sku"])
  .index("by_monday_item", ["mondayItemId"]);

// Export schema
export const productsSchema = {
  products: productsTable,
  productVariants: productVariantsTable, // Ensure this is included
};
