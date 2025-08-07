import { generateUniqueSlug, sanitizeSlug } from "../../lib/slugs";

import { mutation } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Create a new product with automatic slug generation
 */
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    price: v.number(),
    salePrice: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    primaryCategoryId: v.id("productCategories"),
    categoryIds: v.array(v.id("productCategories")),
    sku: v.string(),
    stockQuantity: v.optional(v.number()),
    isDigital: v.boolean(),
    hasVariants: v.boolean(),
    tags: v.optional(v.array(v.string())),
    isFeatured: v.optional(v.boolean()),
    taxable: v.optional(v.boolean()),
    taxClass: v.optional(v.string()),
    weight: v.optional(v.number()),
    dimensions: v.optional(
      v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
        unit: v.string(),
      }),
    ),
    downloadFileId: v.optional(v.id("downloads")),
    images: v.optional(
      v.array(
        v.object({
          url: v.string(),
          alt: v.optional(v.string()),
          position: v.optional(v.number()),
          isPrimary: v.optional(v.boolean()),
          // Additional fields from media upload system
          name: v.optional(v.string()),
          size: v.optional(v.number()),
          storageId: v.optional(v.id("_storage")),
        }),
      ),
    ),
    status: v.optional(v.string()),
    isVisible: v.optional(v.boolean()),
    variantAttributes: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.array(v.string())),
    relatedProductIds: v.optional(v.array(v.id("products"))),
    customSlug: v.optional(v.string()),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    const {
      name,
      customSlug,
      price,
      categoryIds,
      isFeatured,
      isVisible,
      taxable,
      status,
      images,
      ...otherArgs
    } = args;
    const timestamp = Date.now();

    // Generate a unique slug from the name or use a custom slug if provided
    let slug;
    if (customSlug) {
      // Sanitize the custom slug if provided
      const sanitizedSlug = sanitizeSlug(customSlug);
      slug = await generateUniqueSlug(ctx.db, "products", sanitizedSlug);
    } else {
      // Generate a slug from the product name
      slug = await generateUniqueSlug(ctx.db, "products", name);
    }

    // Create the product
    const productId = await ctx.db.insert("products", {
      name,
      slug,
      price,
      priceInCents: price, // For backward compatibility
      categoryIds,
      status: status ?? "draft", // Default to draft
      isVisible: isVisible ?? false, // Default to not visible
      isFeatured: isFeatured ?? false, // Default to not featured
      taxable: taxable ?? true, // Default to taxable
      images: images ?? [], // Default to empty array
      createdAt: timestamp,
      updatedAt: timestamp,
      ...otherArgs,
    });

    return productId;
  },
});
