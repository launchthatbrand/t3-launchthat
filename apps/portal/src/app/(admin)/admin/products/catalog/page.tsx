"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Pencil, PlusCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

// Import EntityList components
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Update to use enhanced product interface
interface EnhancedProduct {
  _id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  status: string;
  isVisible: boolean;
  isDigital: boolean;
  categoryIds: string[];
  primaryCategoryId: string;
  sku?: string;
  images?: {
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
  productCount?: number;
}

export default function ProductCatalogPage() {
  const router = useRouter();
  const [showCategorySidebar, _setShowCategorySidebar] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);

  // Fetch products with filters
  const productsQuery = useQuery(api.ecommerce.products.index.listProducts, {});
  const products = productsQuery ?? [];

  // Fetch categories for the tree view
  const categoryTreeQuery = useQuery(
    api.ecommerce.categories.index.getCategoryTree,
    {},
  );
  const categoryTree: CategoryWithChildren[] = categoryTreeQuery ?? [];

  // Format price from cents to dollars for display
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  // Handle navigation to product creation page
  const handleAddProduct = () => {
    router.push("/admin/products/create");
  };

  // Pre-filter products by selected category from sidebar
  const categoryFilteredProducts = selectedCategoryId
    ? products.filter(
        (product: EnhancedProduct) =>
          product.primaryCategoryId === selectedCategoryId ||
          (Array.isArray(product.categoryIds) &&
            product.categoryIds.includes(selectedCategoryId)),
      )
    : products;

  // Define column configurations for EntityList
  const columns: ColumnDefinition<EnhancedProduct>[] = [
    {
      id: "name",
      header: "Product Name",
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "price",
      header: "Price",
      accessorKey: "price",
      sortable: true,
      cell: (product) => formatPrice(product.price),
    },
    {
      id: "salePrice",
      header: "Sale Price",
      accessorKey: "salePrice",
      sortable: true,
      cell: (product) =>
        product.salePrice ? formatPrice(product.salePrice) : "-",
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (product) => {
        const statusMap = {
          active: { label: "Active", variant: "default" },
          draft: { label: "Draft", variant: "secondary" },
          archived: { label: "Archived", variant: "destructive" },
        };

        const status = statusMap[product.status as keyof typeof statusMap] ?? {
          label: product.status,
          variant: "outline",
        };

        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      id: "isDigital",
      header: "Type",
      accessorKey: "isDigital",
      sortable: true,
      cell: (product) => (
        <Badge variant="outline">
          {product.isDigital ? "Digital" : "Physical"}
        </Badge>
      ),
    },
    {
      id: "isVisible",
      header: "Visibility",
      accessorKey: "isVisible",
      sortable: true,
      cell: (product) => (
        <Badge variant={product.isVisible ? "default" : "secondary"}>
          {product.isVisible ? "Visible" : "Hidden"}
        </Badge>
      ),
    },
  ];

  // Define filter configurations for EntityList
  const filters: FilterConfig<EnhancedProduct>[] = [
    {
      id: "name",
      label: "Name",
      type: "text",
      field: "name",
    },
    {
      id: "price",
      label: "Price",
      type: "number",
      field: "price",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "status",
      options: [
        { label: "Active", value: "active" },
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
      ],
    },
    {
      id: "isDigital",
      label: "Product Type",
      type: "boolean",
      field: "isDigital",
    },
    {
      id: "isVisible",
      label: "Visibility",
      type: "boolean",
      field: "isVisible",
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<EnhancedProduct>[] = [
    {
      id: "edit",
      label: "Edit",
      onClick: (product) => {
        router.push(`/admin/products/edit/${product._id}`);
      },
      variant: "secondary",
      icon: <Pencil className="mr-2 h-4 w-4" />,
    },
    {
      id: "view",
      label: "View",
      onClick: (product) => {
        router.push(`/store/product/${product._id}`);
      },
      variant: "outline",
      icon: <Pencil className="mr-2 h-4 w-4" />,
    },
  ];

  // Recursive function to render the category tree
  const renderCategoryTree = (
    categories: CategoryWithChildren[],
    level = 0,
    parentExpanded = true,
  ) => {
    if (categories.length === 0) return null;

    return categories.map((category) => (
      <div key={category._id} className={`ml-${level * 4}`}>
        <div
          className={`cursor-pointer py-1 hover:bg-gray-100 ${
            selectedCategoryId === category._id ? "font-semibold" : ""
          }`}
          onClick={() =>
            setSelectedCategoryId(
              selectedCategoryId === category._id ? undefined : category._id,
            )
          }
        >
          {category.name} ({category.productCount ?? 0})
        </div>
        {category.children?.length > 0 && (
          <div className="ml-4">
            {renderCategoryTree(
              category.children,
              level + 1,
              parentExpanded && Boolean(selectedCategoryId),
            )}
          </div>
        )}
      </div>
    ));
  };

  // Custom header actions
  const headerActions = (
    <Button onClick={handleAddProduct}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Product
    </Button>
  );

  return (
    <div className="container p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Sidebar with categories */}
        {showCategorySidebar && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="categories">
                  <AccordionItem value="categories">
                    <AccordionTrigger>Browse Categories</AccordionTrigger>
                    <AccordionContent>
                      <div className="mt-2 space-y-1">
                        <div
                          className={`cursor-pointer py-1 hover:bg-gray-100 ${
                            !selectedCategoryId ? "font-semibold" : ""
                          }`}
                          onClick={() => setSelectedCategoryId(undefined)}
                        >
                          All Products
                        </div>
                        {renderCategoryTree(categoryTree)}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product listing */}
        <div
          className={showCategorySidebar ? "md:col-span-3" : "md:col-span-4"}
        >
          <EntityList<EnhancedProduct>
            data={categoryFilteredProducts}
            columns={columns}
            filters={filters}
            isLoading={productsQuery === undefined}
            title={selectedCategoryId ? "Category Products" : "Product Catalog"}
            description={`Manage your ${selectedCategoryId ? "category" : ""} products here`}
            defaultViewMode="list"
            viewModes={["list", "grid"]}
            entityActions={entityActions}
            actions={headerActions}
            emptyState={
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <p className="text-muted-foreground">No products found</p>
                <Button asChild variant="outline">
                  <span onClick={handleAddProduct}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create your first
                    product
                  </span>
                </Button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
