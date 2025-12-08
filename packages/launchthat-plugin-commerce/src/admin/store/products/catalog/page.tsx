"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { Pencil, PlusCircle } from "lucide-react";

import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list/EntityList";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Update to use enhanced product interface
interface EnhancedProduct extends Record<string, unknown> {
  _id: Id<"products">;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  status: string;
  isVisible: boolean;
  isDigital: boolean;
  sku?: string;
  images?: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];
}

export default function ProductCatalogPage() {
  const router = useRouter();
  const productsQuery = useQuery(
    api.ecommerce.products.queries.listProducts,
    {},
  );
  const products = productsQuery ?? [];
  const isLoading = productsQuery === undefined;

  const formatPrice = (price: number) => `$${(price / 100).toFixed(2)}`;

  const handleAddProduct = () => {
    router.push("/admin/store/products/create");
  };

  const columns = useMemo<ColumnDefinition<EnhancedProduct>[]>(() => {
    const statusMap: Record<string, { label: string; variant: BadgeVariant }> =
      {
        active: { label: "Active", variant: "default" },
        draft: { label: "Draft", variant: "secondary" },
        archived: { label: "Archived", variant: "destructive" },
      };

    return [
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
        cell: (product: EnhancedProduct) => formatPrice(product.price),
      },
      {
        id: "salePrice",
        header: "Sale Price",
        accessorKey: "salePrice",
        sortable: true,
        cell: (product: EnhancedProduct) =>
          product.salePrice ? formatPrice(product.salePrice) : "-",
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        sortable: true,
        cell: (product: EnhancedProduct) => {
          const status = statusMap[
            product.status as keyof typeof statusMap
          ] ?? {
            label: product.status,
            variant: "outline" as BadgeVariant,
          };
          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
      },
      {
        id: "isDigital",
        header: "Type",
        accessorKey: "isDigital",
        sortable: true,
        cell: (product: EnhancedProduct) => (
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
        cell: (product: EnhancedProduct) => (
          <Badge variant={product.isVisible ? "default" : "secondary"}>
            {product.isVisible ? "Visible" : "Hidden"}
          </Badge>
        ),
      },
    ];
  }, []);

  const filters = useMemo<FilterConfig<EnhancedProduct>[]>(() => {
    return [
      { id: "name", label: "Name", type: "text", field: "name" },
      { id: "price", label: "Price", type: "number", field: "price" },
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
  }, []);

  const entityActions = useMemo<EntityAction<EnhancedProduct>[]>(() => {
    return [
      {
        id: "edit",
        label: "Edit",
        onClick: (product) =>
          router.push(`/admin/store/products/${product._id}`),
        variant: "secondary",
        icon: <Pencil className="mr-2 h-4 w-4" />,
      },
      {
        id: "view",
        label: "View",
        onClick: (product) => router.push(`/store/product/${product._id}`),
        variant: "outline",
        icon: <Pencil className="mr-2 h-4 w-4" />,
      },
    ];
  }, [router]);

  const headerActions = (
    <Button onClick={handleAddProduct}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Product
    </Button>
  );

  return (
    <div className="container p-6">
      <EntityList<EnhancedProduct>
        data={products}
        columns={columns}
        filters={filters}
        isLoading={isLoading}
        title="Product Catalog"
        description="Manage your products, pricing, and inventory"
        defaultViewMode="list"
        viewModes={["list", "grid"]}
        entityActions={entityActions}
        actions={headerActions}
        emptyState={
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground">No products found</p>
            <Button variant="outline" onClick={handleAddProduct}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create your first product
            </Button>
          </div>
        }
      />
    </div>
  );
}
