import type { Doc } from "../../_generated/dataModel";

export type ProductUpdateData = Partial<
  Omit<Doc<"products">, "_id" | "_creationTime">
> & {
  basePrice?: number;
  inventoryLevel?: number;
  customSlug?: string;
};

export function prepareProductUpdates(
  updateData: ProductUpdateData,
): Partial<Doc<"products">> {
  const updates: Partial<Doc<"products">> = {
    updatedAt: Date.now(),
  };

  Object.keys(updateData).forEach((key) => {
    const value = updateData[key as keyof ProductUpdateData];
    if (value !== undefined) {
      if (key === "price" || key === "basePrice") {
        // Handle price field for compatibility
        const priceValue = updateData.price ?? updateData.basePrice;
        if (priceValue !== undefined) {
          updates.price = priceValue;
          updates.priceInCents = priceValue;
        }
      } else if (key === "stockQuantity") {
        updates.stockQuantity = updateData.stockQuantity;
      } else if (key === "inventoryLevel") {
        updates.stockQuantity = updateData.inventoryLevel;
      } else if (key !== "customSlug" && key !== "basePrice") {
        // Don't include customSlug or basePrice in the database update
        (updates as any)[key] = value;
      }
    }
  });

  // Handle status-dependent fields
  if (updateData.status) {
    updates.isPublished = updateData.status === "active";
  }

  return updates;
}
