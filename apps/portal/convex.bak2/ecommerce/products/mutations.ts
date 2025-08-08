import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { generateUniqueSlug, sanitizeSlug } from "../../lib/slugs";

/**
 * Create Product
 */
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    basePrice: v.optional(v.number()),
    price: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    sku: v.string(),
    stockStatus: v.optional(
      v.union(v.literal("in_stock"), v.literal("out_of_stock")),
    ),
    stockQuantity: v.optional(v.number()),
    inventoryLevel: v.optional(v.number()),
    primaryCategoryId: v.optional(v.id("productCategories")),
    categoryIds: v.array(v.id("productCategories")),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived"),
    ),
    isVisible: v.boolean(),
    isDigital: v.boolean(),
    hasVariants: v.boolean(),
    images: v.array(
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
    taxable: v.boolean(),
    isFeatured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.array(v.string())),
    customSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate a unique slug using the centralized slug system
    let slug;
    if (args.customSlug) {
      // If a custom slug is provided, sanitize it and ensure uniqueness
      const sanitizedSlug = sanitizeSlug(args.customSlug);
      slug = await generateUniqueSlug(ctx.db, "products", sanitizedSlug);
    } else {
      // Generate a slug from the product name
      slug = await generateUniqueSlug(ctx.db, "products", args.name);
    }

    // Handle price field for compatibility with both schemas
    const priceValue = args.price ?? args.basePrice ?? 0;

    // Ensure we have a primary category ID - use the first category if not specified
    let primaryCategoryId: Id<"productCategories"> | undefined =
      args.primaryCategoryId;

    if (!primaryCategoryId && args.categoryIds.length > 0) {
      primaryCategoryId = args.categoryIds[0];
    }

    // If we don't have a primary category ID and it's required, throw an error
    if (!primaryCategoryId) {
      throw new Error("A primary category ID is required");
    }

    // Prepare product data - ensure all required fields from the unified schema are present
    const productData = {
      name: args.name,
      slug,
      description: args.description,
      shortDescription: args.shortDescription,
      priceInCents: priceValue, // Required by ecommerceSchema
      price: priceValue, // Required by ecommerceCategoriesSchema
      salePrice: args.salePrice,
      costPrice: args.costPrice,
      sku: args.sku,
      stockStatus: args.stockStatus ?? "in_stock", // Default to in_stock if not specified
      stockQuantity: args.stockQuantity ?? args.inventoryLevel,
      primaryCategoryId: primaryCategoryId, // Now guaranteed to be defined
      categoryIds: args.categoryIds,
      status: args.status,
      isVisible: args.isVisible,
      isDigital: args.isDigital,
      hasVariants: args.hasVariants,
      images: args.images,
      taxable: args.taxable,
      isFeatured: args.isFeatured ?? false,
      tags: args.tags ?? [],
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      metaKeywords: args.metaKeywords,
      isPublished: args.status === "active", // For backward compatibility
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return await ctx.db.insert("products", productData);
  },
});

/**
 * Update Product
 */
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    price: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    sku: v.optional(v.string()),
    stockStatus: v.optional(
      v.union(v.literal("in_stock"), v.literal("out_of_stock")),
    ),
    stockQuantity: v.optional(v.number()),
    primaryCategoryId: v.optional(v.id("productCategories")),
    categoryIds: v.optional(v.array(v.id("productCategories"))),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    ),
    isVisible: v.optional(v.boolean()),
    isDigital: v.optional(v.boolean()),
    hasVariants: v.optional(v.boolean()),
    images: v.optional(
      v.array(
        v.object({
          url: v.string(),
          alt: v.optional(v.string()),
          position: v.optional(v.number()),
          isPrimary: v.optional(v.boolean()),
          name: v.optional(v.string()),
          size: v.optional(v.number()),
          storageId: v.optional(v.id("_storage")),
        }),
      ),
    ),
    taxable: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.array(v.string())),
    customSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { productId, customSlug, ...updateData } = args;

    // Prepare the update object
    const updates: Partial<Doc<"products">> = {
      updatedAt: Date.now(),
    };

    // Handle slug update if name or customSlug is provided
    if (updateData.name || customSlug) {
      if (customSlug) {
        const sanitizedSlug = sanitizeSlug(customSlug);
        updates.slug = await generateUniqueSlug(
          ctx.db,
          "products",
          sanitizedSlug,
          productId,
        );
      } else if (updateData.name) {
        updates.slug = await generateUniqueSlug(
          ctx.db,
          "products",
          updateData.name,
          productId,
        );
      }
    }

    // Add all other updates directly
    if (updateData.name !== undefined) updates.name = updateData.name;
    if (updateData.description !== undefined)
      updates.description = updateData.description;
    if (updateData.shortDescription !== undefined)
      updates.shortDescription = updateData.shortDescription;
    if (updateData.price !== undefined) {
      updates.price = updateData.price;
      updates.priceInCents = updateData.price;
    }
    if (updateData.salePrice !== undefined)
      updates.salePrice = updateData.salePrice;
    if (updateData.costPrice !== undefined)
      updates.costPrice = updateData.costPrice;
    if (updateData.sku !== undefined) updates.sku = updateData.sku;
    if (updateData.stockStatus !== undefined)
      updates.stockStatus = updateData.stockStatus;
    if (updateData.stockQuantity !== undefined)
      updates.stockQuantity = updateData.stockQuantity;
    if (updateData.primaryCategoryId !== undefined)
      updates.primaryCategoryId = updateData.primaryCategoryId;
    if (updateData.categoryIds !== undefined)
      updates.categoryIds = updateData.categoryIds;
    if (updateData.status !== undefined) {
      updates.status = updateData.status;
      updates.isPublished = updateData.status === "active";
    }
    if (updateData.isVisible !== undefined)
      updates.isVisible = updateData.isVisible;
    if (updateData.isDigital !== undefined)
      updates.isDigital = updateData.isDigital;
    if (updateData.hasVariants !== undefined)
      updates.hasVariants = updateData.hasVariants;
    if (updateData.images !== undefined) updates.images = updateData.images;
    if (updateData.taxable !== undefined) updates.taxable = updateData.taxable;
    if (updateData.isFeatured !== undefined)
      updates.isFeatured = updateData.isFeatured;
    if (updateData.tags !== undefined) updates.tags = updateData.tags;
    if (updateData.metaTitle !== undefined)
      updates.metaTitle = updateData.metaTitle;
    if (updateData.metaDescription !== undefined)
      updates.metaDescription = updateData.metaDescription;
    if (updateData.metaKeywords !== undefined)
      updates.metaKeywords = updateData.metaKeywords;

    await ctx.db.patch(productId, updates);
  },
});

/**
 * Delete Product
 */
export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.productId);
  },
});
