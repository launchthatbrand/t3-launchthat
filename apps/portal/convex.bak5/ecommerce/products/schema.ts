import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define a unified product schema that's compatible with both older and newer code
// Renamed from unifiedProductsTable to productsTable for consistency
export const productsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy

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
  categoryIds: v.optional(v.array(v.id("categories"))), // All categories this product belongs to

  // Pricing (enhanced) - price is the main field, priceInCents kept for backward compatibility
  price: v.number(), // Main price field - supports decimals (e.g., 9.99, 0.13, 999)
  salePrice: v.optional(v.number()),
  costPrice: v.optional(v.number()),

  // Inventory
  sku: v.string(),
  stockStatus: v.optional(
    v.union(v.literal("in_stock"), v.literal("out_of_stock")),
  ), // Primary stock status field - optional for backward compatibility
  stockQuantity: v.optional(v.number()), // Optional: actual quantity if tracking specific amounts

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
      // Additional fields from media upload system
      name: v.optional(v.string()),
      size: v.optional(v.number()),
      storageId: v.optional(v.id("_storage")),
    }),
  ),

  // Enhanced media support - link to media items
  mediaItems: v.optional(
    v.array(
      v.object({
        mediaItemId: v.id("mediaItems"),
        alt: v.optional(v.string()),
        position: v.optional(v.number()),
        isPrimary: v.optional(v.boolean()),
      }),
    ),
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
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_status", ["organizationId", "status"])
  .index("by_organization_visible", ["organizationId", "isVisible"])
  .index("by_organization_featured", ["organizationId", "isFeatured"])
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
  .searchIndex("search_products_name", {
    searchField: "name",
    filterFields: [
      "organizationId",
      "status",
      "isVisible",
      "isFeatured",
      "isDigital",
    ],
  })
  .searchIndex("search_products_description", {
    searchField: "description",
    filterFields: [
      "organizationId",
      "status",
      "isVisible",
      "isFeatured",
      "isDigital",
    ],
  });

// Re-define productVariantsTable if it was part of the old productsSchema.ts
// Based on previous logs, productVariantsTable was defined in the main schema.ts and moved here.
// It was: defineTable({ productId: v.id("products"), attributes: v.any(), stock: v.number() })
export const productVariantsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  productId: v.id("products"),
  name: v.string(), // e.g., "Small", "Medium", "Large" or "Red", "Blue"
  sku: v.optional(v.string()),
  priceInCents: v.number(), // Override product price
  compareAtPriceInCents: v.optional(v.number()),

  // Inventory tracking
  trackQuantity: v.optional(v.boolean()),
  quantity: v.optional(v.number()),
  allowBackorder: v.optional(v.boolean()),

  // Physical properties
  weight: v.optional(v.number()),
  requiresShipping: v.optional(v.boolean()),

  // Variant attributes (dynamic key-value pairs)
  attributes: v.optional(
    v.array(
      v.object({
        name: v.string(), // e.g., "Size", "Color"
        value: v.string(), // e.g., "Large", "Red"
      }),
    ),
  ),

  // Status
  isActive: v.optional(v.boolean()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_product", ["productId"])
  .index("by_organization_product", ["organizationId", "productId"])
  .index("by_sku", ["sku"]);

// Export schema
export const productsSchema = {
  products: productsTable,
  productVariants: productVariantsTable, // Ensure this is included
};
