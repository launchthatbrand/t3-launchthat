"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
// Import the AddToCartButton component
import { AddToCartButton } from "@/components/cart";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

// Import EntityList components
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
  FilterValue,
} from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";

// Define type for enhanced product
interface EnhancedProduct {
  _id: Id<"products">;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  status: string;
  isVisible: boolean;
  categoryIds: Id<"productCategories">[];
  primaryCategoryId: Id<"productCategories">;
  images: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];
}

// Define type for category with children
interface CategoryWithChildren {
  _id: Id<"productCategories">;
  name: string;
  children: CategoryWithChildren[];
}

type Product = Doc<"products">;

export default function StoreFrontPage() {
  const [_activeFilters, setActiveFilters] = useState<
    Record<string, FilterValue>
  >({});
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<Id<"productCategories"> | null>(null);

  // Fetch products - only get visible and active products
  const products = useQuery(api.ecommerce.products.queries.listProducts, {
    isVisible: true,
    // categoryId: selectedCategoryId ?? undefined,
  });

  console.log("products", products);

  // Fetch categories for the sidebar - only get visible categories
  // const categories = useQuery(api.ecommerce.queries.getCategoryTree, {
  //   isVisible: true,
  //   isActive: true,
  // });

  // Format price from cents to dollars for display
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  // Prepare categories for filter options
  // const categoryOptions = (categories as CategoryWithChildren[]).flatMap(
  //   (category) => {
  //     // Start with the top-level category
  //     const options = [{ label: category.name, value: category._id }];

  //     // Add child categories (flat structure for simplicity)
  //     category.children.forEach((child) => {
  //       options.push({
  //         label: `${category.name} > ${child.name}`,
  //         value: child._id,
  //       });
  //     });

  //     return options;
  //   },
  // );

  // Define column configurations for EntityList
  const columns: ColumnDef<Product>[] = [
    {
      id: "name",
      header: "Product",
      accessorKey: "name",
      enableSorting: true,
      // sortable: true,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-md">
              {product.images.length > 0 ? (
                <Image
                  src={product.images[0]?.url ?? ""}
                  alt={product.images[0]?.alt ?? product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-500">
                  No image
                </div>
              )}
            </div>
            <Link
              href={`/store/product/${product._id}`}
              className="font-medium"
            >
              {product.name}
            </Link>
          </div>
        );
      },
    },
    {
      id: "price",
      header: "Price",
      accessorKey: "price",
      sortable: true,
      cell: (product) => (
        <div className="font-medium">
          {product.salePrice ? (
            <div>
              <span className="text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>{" "}
              <span className="text-primary">
                {formatPrice(product.salePrice)}
              </span>
            </div>
          ) : (
            formatPrice(product.price)
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (product) => (
        <Badge variant={product.status === "active" ? "outline" : "secondary"}>
          {product.status}
        </Badge>
      ),
    },
  ];

  // Define filter configurations for EntityList
  const filters: FilterConfig<EnhancedProduct>[] = [
    {
      id: "name",
      label: "Product Name",
      type: "text",
      field: "name",
    },
    {
      id: "price",
      label: "Price",
      type: "number",
      field: "price",
    },
    // {
    //   id: "category",
    //   label: "Category",
    //   type: "select",
    //   field: "primaryCategoryId",
    //   options: categoryOptions,
    // },
  ];

  // Define entity actions for the EntityList
  const entityActions: EntityAction<EnhancedProduct>[] = [
    {
      id: "addToCart",
      label: "Add to Cart",
      onClick: (_product) => {
        // The AddToCartButton component will handle the actual functionality
        // This is just a placeholder to define the action
      },
      variant: "secondary",
    },
  ];

  // Custom renderer for product cards (unused but kept for reference)
  const _ProductCardRenderer = (_product: EnhancedProduct) => (
    <Card className="flex h-full flex-col">
      <div className="relative aspect-square w-full bg-gray-100">
        {_product.images.length > 0 ? (
          <Image
            src={_product.images[0]?.url ?? ""}
            alt={_product.images[0]?.alt ?? _product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-1">{_product.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {_product.shortDescription ??
            _product.description ??
            "No description available"}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {_product.salePrice ? (
            <div>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(_product.price)}
              </span>{" "}
              <span className="text-primary">
                {formatPrice(_product.salePrice)}
              </span>
            </div>
          ) : (
            formatPrice(_product.price)
          )}
        </div>
        <AddToCartButton productId={_product._id} />
      </CardFooter>
    </Card>
  );

  // Handle filter changes
  const _handleFilterChange = (newFilters: Record<string, FilterValue>) => {
    setActiveFilters(newFilters);

    // Update category filter
    if (newFilters.category && typeof newFilters.category === "string") {
      setSelectedCategoryId(newFilters.category as Id<"productCategories">);
    } else {
      setSelectedCategoryId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Shop Products</h1>

      <EntityList<EnhancedProduct>
        data={products as EnhancedProduct[]}
        columns={columns}
        filters={filters}
        isLoading={false}
        title="Product Catalog"
        description="Browse our selection of products"
        defaultViewMode="grid"
        viewModes={["list", "grid"]}
        entityActions={entityActions}
        emptyState={
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
            <p className="text-muted-foreground">No products found</p>
          </div>
        }
      />
    </div>
  );
}
