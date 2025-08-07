import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";

/**
 * Get variations for a product
 */
export const getProductVariations = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    return variations;
  },
});

/**
 * Get a single variation by ID
 */
export const getVariation = query({
  args: {
    variationId: v.id("productVariants"),
  },
  handler: async (ctx, args) => {
    const variation = await ctx.db.get(args.variationId);
    return variation;
  },
});

/**
 * Create a new product variation
 */
export const createVariation = mutation({
  args: {
    productId: v.id("products"),
    attributes: v.any(),
    sku: v.optional(v.string()),
    stockQuantity: v.number(),
    price: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    weight: v.optional(v.number()),
    images: v.optional(
      v.array(v.object({ url: v.string(), alt: v.optional(v.string()) })),
    ),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if product exists
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error(`Product with ID ${args.productId} not found`);
    }

    // Validate the attributes against the product's variant attributes if defined
    if (product.variantAttributes && Array.isArray(product.variantAttributes)) {
      // Check if all required attributes are present
      const providedAttributes = Object.keys(args.attributes);
      const missingAttributes = product.variantAttributes.filter(
        (attr) => !providedAttributes.includes(attr),
      );

      if (missingAttributes.length > 0) {
        throw new Error(
          `Missing required attributes: ${missingAttributes.join(", ")}`,
        );
      }
    }

    // If no SKU is provided, generate one based on the product SKU and attributes
    let sku = args.sku;
    if (!sku && product.sku) {
      const attributeValues = Object.values(args.attributes).join("-");
      sku = `${product.sku}-${attributeValues}`;
    }

    // Create the variation
    const variationId = await ctx.db.insert("productVariants", {
      productId: args.productId,
      attributes: args.attributes,
      sku,
      stockQuantity: args.stockQuantity,
      price: args.price,
      salePrice: args.salePrice,
      weight: args.weight,
      images: args.images,
      isPublished: args.isPublished ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return variationId;
  },
});

/**
 * Update an existing product variation
 */
export const updateVariation = mutation({
  args: {
    variationId: v.id("productVariants"),
    attributes: v.any(),
    sku: v.optional(v.string()),
    stockQuantity: v.number(),
    price: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    weight: v.optional(v.number()),
    images: v.optional(
      v.array(v.object({ url: v.string(), alt: v.optional(v.string()) })),
    ),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if variation exists
    const variation = await ctx.db.get(args.variationId);
    if (!variation) {
      throw new Error(`Variation with ID ${args.variationId} not found`);
    }

    // Check if product exists
    const product = await ctx.db.get(variation.productId);
    if (!product) {
      throw new Error(`Product with ID ${variation.productId} not found`);
    }

    // Validate the attributes against the product's variant attributes if defined
    if (product.variantAttributes && Array.isArray(product.variantAttributes)) {
      // Check if all required attributes are present
      const providedAttributes = Object.keys(args.attributes);
      const missingAttributes = product.variantAttributes.filter(
        (attr) => !providedAttributes.includes(attr),
      );

      if (missingAttributes.length > 0) {
        throw new Error(
          `Missing required attributes: ${missingAttributes.join(", ")}`,
        );
      }
    }

    // Update the variation
    await ctx.db.patch(args.variationId, {
      attributes: args.attributes,
      sku: args.sku,
      stockQuantity: args.stockQuantity,
      price: args.price,
      salePrice: args.salePrice,
      weight: args.weight,
      images: args.images,
      isPublished: args.isPublished,
      updatedAt: Date.now(),
    });

    return args.variationId;
  },
});

/**
 * Delete a product variation
 */
export const deleteVariation = mutation({
  args: {
    variationId: v.id("productVariants"),
  },
  handler: async (ctx, args) => {
    // Check if variation exists
    const variation = await ctx.db.get(args.variationId);
    if (!variation) {
      throw new Error(`Variation with ID ${args.variationId} not found`);
    }

    // Delete the variation
    await ctx.db.delete(args.variationId);

    return { success: true };
  },
});
