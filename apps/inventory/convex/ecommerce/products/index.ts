import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { internalQuery, mutation, query } from "../../_generated/server";
import { generateUniqueSlug, sanitizeSlug } from "../../lib/slugs";

/**
 * List all products
 */
export const listProducts = query({
  args: {
    isVisible: v.optional(v.boolean()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    ),
    categoryId: v.optional(v.id("productCategories")),
  },
  handler: async (ctx, args) => {
    let productsQuery = ctx.db.query("products");

    // Apply filters if provided
    if (args.isVisible !== undefined) {
      productsQuery = productsQuery.filter((q) =>
        q.eq(q.field("isVisible"), args.isVisible),
      );
    }

    if (args.status !== undefined) {
      productsQuery = productsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    // Get all products with the applied filters
    const allFilteredProducts = await productsQuery.collect();

    // If categoryId is specified, filter products that have it as primary or in categoryIds
    if (args.categoryId !== undefined) {
      const categoryIdString = args.categoryId as string;
      return allFilteredProducts.filter((product) => {
        // Check primaryCategoryId match
        const primaryMatch = product.primaryCategoryId === categoryIdString;

        // Check if category is in categoryIds array
        let categoryIdsMatch = false;
        if (Array.isArray(product.categoryIds)) {
          categoryIdsMatch = product.categoryIds.some(
            (id) => id === categoryIdString,
          );
        }

        return primaryMatch || categoryIdsMatch;
      });
    }

    // No category filter, return all filtered products
    return allFilteredProducts;
  },
});

/**
 * Get a single product by ID (internal)
 */
export const getProduct = internalQuery({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new product
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
 * Update an existing product
 */
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    sku: v.string(),
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
    // Check if product exists
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error(`Product with ID ${args.productId} not found`);
    }

    // Generate a unique slug if the name changed or a custom slug is provided
    let slug = product.slug;

    if (args.customSlug) {
      // If a custom slug is provided, sanitize it and ensure uniqueness
      const sanitizedSlug = sanitizeSlug(args.customSlug);
      slug = await generateUniqueSlug(
        ctx.db,
        "products",
        sanitizedSlug,
        args.productId,
      );
    } else if (args.name !== product.name) {
      // If name changed, generate a new slug from the name
      slug = await generateUniqueSlug(
        ctx.db,
        "products",
        args.name,
        args.productId,
      );
    }

    // Prepare updated product data
    const updatedProductData = {
      name: args.name,
      slug,
      description: args.description,
      shortDescription: args.shortDescription,
      basePrice: args.basePrice,
      salePrice: args.salePrice,
      costPrice: args.costPrice,
      sku: args.sku,
      inventoryLevel: args.inventoryLevel,
      primaryCategoryId: args.primaryCategoryId,
      categoryIds: args.categoryIds,
      status: args.status,
      isVisible: args.isVisible,
      isDigital: args.isDigital,
      hasVariants: args.hasVariants,
      images: args.images,
      taxable: args.taxable,
      isFeatured: args.isFeatured ?? false,
      tags: args.tags,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      metaKeywords: args.metaKeywords,
      updatedAt: Date.now(),
    };

    return await ctx.db.patch(args.productId, updatedProductData);
  },
});

/**
 * Delete a product
 */
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    // Check if product exists
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error(`Product with ID ${args.productId} not found`);
    }

    // Delete the product
    await ctx.db.delete(args.productId);

    return { success: true };
  },
});

/**
 * Get the total count of products
 */
export const getProductCount = query({
  args: {
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    ),
  },
  handler: async (ctx, args) => {
    let productsQuery = ctx.db.query("products");

    // Apply status filter if provided
    if (args.status !== undefined) {
      productsQuery = productsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    // Count all products with the applied filters
    const products = await productsQuery.collect();
    return products.length;
  },
});

/**
 * List products with pagination (internal)
 */
export const listProductsInternal = internalQuery({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("products")),
    category: v.optional(v.id("productCategories")),
    searchTerm: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { limit = 10, cursor, category, searchTerm, featured, status } = args;

    let query = ctx.db.query("products");

    // Apply filters
    if (category) {
      query = query.withIndex("by_primary_category", (q) =>
        q.eq("primaryCategoryId", category),
      );
    } else if (featured) {
      query = query.withIndex("by_featured", (q) =>
        q.eq("isFeatured", featured),
      );
    } else if (status) {
      query = query.withIndex("by_status", (q) => q.eq("status", status));
    }

    // Apply search if provided
    if (searchTerm) {
      query = query.withSearchIndex("search_products_name", (q) =>
        q.search("name", searchTerm),
      );
    }

    // Apply cursor for pagination if provided
    if (cursor) {
      query = query.cursor(cursor);
    }

    // Order by most recently updated and take items
    const items = await query.order("desc").take(limit);

    // Set up pagination metadata
    let nextCursor = null;
    if (items.length === limit) {
      nextCursor = items[items.length - 1]._id;
    }

    return {
      items,
      hasMore: !!nextCursor,
      nextCursor,
    };
  },
});

/**
 * Public query to get a product by ID
 */
export const get = query({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Public query to list products with pagination
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("products")),
    category: v.optional(v.id("productCategories")),
    searchTerm: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    onlyVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const {
      limit = 10,
      cursor,
      category,
      searchTerm,
      featured,
      onlyVisible = true,
    } = args;

    let query = ctx.db.query("products");

    // Only show published products by default
    if (onlyVisible) {
      query = query.withIndex("by_visible", (q) => q.eq("isVisible", true));
    }

    // Apply filters
    if (category) {
      query = query.withIndex("by_primary_category", (q) =>
        q.eq("primaryCategoryId", category),
      );
    } else if (featured) {
      query = query.withIndex("by_featured", (q) =>
        q.eq("isFeatured", featured),
      );
    }

    // Apply search if provided
    if (searchTerm) {
      query = query.withSearchIndex("search_products_name", (q) =>
        q.search("name", searchTerm),
      );
    }

    // Apply cursor for pagination if provided
    if (cursor) {
      query = query.cursor(cursor);
    }

    // Order by most recently updated and take items
    const items = await query.order("desc").take(limit);

    // Set up pagination metadata
    let nextCursor = null;
    if (items.length === limit) {
      nextCursor = items[items.length - 1]._id;
    }

    return {
      items,
      hasMore: !!nextCursor,
      nextCursor,
    };
  },
});
