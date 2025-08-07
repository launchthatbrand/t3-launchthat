"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import React, { useMemo, useState } from "react";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui";

// Product type for the dialog
interface Product {
  _id: Id<"products">;
  name: string;
  sku?: string;
  price: number;
  description?: string;
  images?: { url?: string }[];
  categoryIds?: Id<"productCategories">[];
  status?: "active" | "inactive" | "draft";
}

interface ProductCategory {
  _id: Id<"productCategories">;
  name: string;
  slug: string;
}

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (productId: Id<"products">, quantity?: number) => void;
}

export function AddProductDialog({
  open,
  onOpenChange,
  onAddProduct,
}: AddProductDialogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>({});

  // Fetch products and categories with proper error handling
  const productsQuery = useQuery(api.ecommerce.products.index.listProducts, {});
  const categoriesQuery = useQuery(
    api.ecommerce.categories.index.getProductCategories,
    {},
  );

  // Transform and filter products based on selected category
  const filteredProducts = useMemo(() => {
    if (!productsQuery || !Array.isArray(productsQuery)) return [];

    let filtered = productsQuery;

    // Filter by category
    if (selectedCategoryId && selectedCategoryId !== "all") {
      filtered = filtered.filter((product) =>
        product.categoryIds?.includes(
          selectedCategoryId as Id<"productCategories">,
        ),
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [productsQuery, selectedCategoryId, searchTerm]);

  const handleAddProductWithQuantity = (product: Product) => {
    const quantity = quantityMap[product._id] || 1;
    onAddProduct(product._id, quantity);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-6xl">
        <DialogHeader>
          <DialogTitle>Add Product to Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesQuery?.map((category: ProductCategory) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products List */}
          <div className="rounded-lg border">
            <div className="border-b bg-muted/50 p-3">
              <div className="text-sm font-medium">
                {filteredProducts.length} products found
              </div>
            </div>
            <div className="max-h-96 overflow-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-muted-foreground">
                    {selectedCategoryId !== "all"
                      ? "No products found in the selected category."
                      : "No products found. Try adjusting your search criteria."}
                  </div>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between border-b p-4 last:border-b-0 hover:bg-muted/50"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      {product.images?.[0]?.url && (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.sku && (
                          <div className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        ${product.price.toFixed(2)}
                      </Badge>

                      <Input
                        type="number"
                        min="1"
                        value={quantityMap[product._id] || 1}
                        onChange={(e) =>
                          setQuantityMap((prev) => ({
                            ...prev,
                            [product._id]: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="w-20"
                        placeholder="Qty"
                      />

                      <Button
                        size="sm"
                        onClick={() => handleAddProductWithQuantity(product)}
                      >
                        Add to Order
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
