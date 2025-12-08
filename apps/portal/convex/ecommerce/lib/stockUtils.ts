import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";

/**
 * Check if a product is in stock
 *
 * @param product - The product document
 * @param quantity - The quantity requested (default: 1)
 * @returns Whether the product is in stock for the requested quantity
 */
export function isInStock(product: Doc<"products">, quantity = 1): boolean {
  // If product doesn't track inventory, always in stock
  if (product.stockQuantity === undefined) {
    return true;
  }

  // Check if stock meets or exceeds requested quantity
  return product.stockQuantity >= quantity;
}

/**
 * Check if a product variation is in stock
 *
 * @param variation - The product variation document
 * @param quantity - The quantity requested (default: 1)
 * @returns Whether the variation is in stock for the requested quantity
 */
export function isVariationInStock(
  variation: Doc<"productVariants">,
  quantity = 1,
): boolean {
  return (variation.quantity ?? 0) >= quantity;
}

/**
 * Update product stock quantity after an order
 *
 * @param ctx - The Convex mutation context
 * @param productId - The product ID
 * @param quantity - The quantity sold
 * @returns The new stock quantity
 */
export async function decreaseProductStock(
  ctx: MutationCtx,
  productId: Id<"products">,
  quantity: number,
): Promise<number> {
  const product = await ctx.db.get(productId);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // If product doesn't track inventory, do nothing
  if (product.stockQuantity === undefined) {
    return -1; // -1 indicates unlimited stock
  }

  // Calculate new stock quantity (min 0)
  const newStock = Math.max(0, product.stockQuantity - quantity);

  // Update the product
  await ctx.db.patch(productId, {
    stockQuantity: newStock,
    updatedAt: Date.now(),
  });

  return newStock;
}

/**
 * Update variation stock quantity after an order
 *
 * @param ctx - The Convex mutation context
 * @param variationId - The variation ID
 * @param quantity - The quantity sold
 * @returns The new stock quantity
 */
export async function decreaseVariationStock(
  ctx: MutationCtx,
  variationId: Id<"productVariants">,
  quantity: number,
): Promise<number> {
  const variation = await ctx.db.get(variationId);
  if (!variation) {
    throw new Error(`Variation with ID ${variationId} not found`);
  }

  // Calculate new stock quantity (min 0)
  const newStock = Math.max(0, (variation.quantity ?? 0) - quantity);

  // Update the variation
  await ctx.db.patch(variationId, {
    quantity: newStock,
    updatedAt: Date.now(),
  });

  return newStock;
}
