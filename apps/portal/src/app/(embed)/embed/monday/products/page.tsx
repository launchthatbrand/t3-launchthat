"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { Edit, Eye, Package, PlusCircle } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import type { Id } from "../../../../../../convex/_generated/dataModel";
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

interface ProductItem {
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
  sku: string;
  stockQuantity?: number;
  createdAt: number;
  updatedAt: number;
  images?: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];
}

export default function ProductsAdminPage() {
  // const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();

  // // Early return if auth is loading or user is not authenticated
  // useEffect(() => {
  //   if (!authLoading && !isAuthenticated) {
  //     toast.error("You must be logged in to access this page.");
  //     router.push("/login");
  //   }
  // }, [authLoading, isAuthenticated, router]);

  // if (authLoading || !isAuthenticated) {
  //   return (
  //     <div className="container p-8">
  //       <div className="flex h-96 items-center justify-center">
  //         <div className="text-center">
  //           <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  //           <p className="text-muted-foreground">
  //             {authLoading ? "Authenticating..." : "Redirecting to login..."}
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return <AuthenticatedProductsPage router={router} />;
}

function AuthenticatedProductsPage({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) {
  // const isAdminResult = useQuery(api.accessControl.checkIsAdmin);

  // useEffect(() => {
  //   if (isAdminResult === false) {
  //     toast.error("You are not authorized to view this page.");
  //     router.push("/dashboard");
  //   }
  // }, [isAdminResult, router]);

  // if (isAdminResult === undefined) {
  //   return (
  //     <div className="container p-8">
  //       <div className="flex h-96 items-center justify-center">
  //         <div className="text-center">
  //           <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  //           <p className="text-muted-foreground">Verifying admin status...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // if (isAdminResult === false) {
  //   return (
  //     <div className="container p-8">
  //       <p className="text-center text-muted-foreground">Redirecting...</p>
  //     </div>
  //   );
  // }

  // At this point, isAdminResult is true.
  return <ProductsContent router={router} />;
}

function ProductsContent({ router }: { router: ReturnType<typeof useRouter> }) {
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from Convex
  const products = useQuery(api.ecommerce.products.index.listProducts, {}) as
    | ProductItem[]
    | undefined;

  // Fetch categories for filters
  const _categories = useQuery(
    api.ecommerce.categories.index.getProductCategories,
    {},
  );

  // Format price from cents to dollars for display
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  useEffect(() => {
    if (products !== undefined) {
      setIsLoading(false);
    }
  }, [products]);

  // Define column configurations
  const columns: ColumnDefinition<ProductItem>[] = [
    {
      id: "name",
      header: "Product Name",
      accessorKey: "name",
      cell: (product) => (
        <div className="flex items-center">
          {product.images && product.images.length > 0 ? (
            <img
              src={
                product.images.find((img) => img.isPrimary)?.url ??
                product.images[0]?.url ??
                "/placeholder.jpg"
              }
              alt={product.name}
              className="mr-3 h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{product.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: "price",
      header: "Price",
      accessorKey: "price",
      cell: (product) => (
        <div>
          {product.salePrice ? (
            <div>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
              <br />
              <span className="font-medium text-green-600">
                {formatPrice(product.salePrice)}
              </span>
            </div>
          ) : (
            <span>{formatPrice(product.price)}</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (product) => {
        const statusMap: Record<
          string,
          {
            label: string;
            variant: "default" | "secondary" | "destructive" | "outline";
          }
        > = {
          active: { label: "Active", variant: "default" },
          draft: { label: "Draft", variant: "secondary" },
          archived: { label: "Archived", variant: "destructive" },
        };

        const status = statusMap[product.status] ?? {
          label: product.status,
          variant: "outline",
        };

        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
      sortable: true,
    },
    {
      id: "type",
      header: "Type",
      accessorKey: "isDigital",
      cell: (product) => (
        <Badge variant="outline">
          {product.isDigital ? "Digital" : "Physical"}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "inventory",
      header: "Inventory",
      accessorKey: "stockQuantity",
      cell: (product) =>
        typeof product.stockQuantity === "number" ? (
          product.stockQuantity
        ) : (
          <span className="text-muted-foreground">N/A</span>
        ),
      sortable: true,
    },
    {
      id: "createdAt",
      header: "Created",
      accessorKey: "createdAt",
      cell: (product) => new Date(product.createdAt).toLocaleDateString(),
      sortable: true,
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<ProductItem>[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "status",
      options: [
        { label: "All", value: "" },
        { label: "Active", value: "active" },
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
      ],
    },
    {
      id: "type",
      label: "Type",
      type: "select",
      field: "isDigital",
      options: [
        { label: "All", value: "" },
        { label: "Digital", value: true },
        { label: "Physical", value: false },
      ],
    },
    {
      id: "visibility",
      label: "Visibility",
      type: "select",
      field: "isVisible",
      options: [
        { label: "All", value: "" },
        { label: "Visible", value: true },
        { label: "Hidden", value: false },
      ],
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<ProductItem>[] = [
    {
      id: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: (product) => {
        router.push(`/admin/store/products/${product._id}`);
      },
      variant: "outline",
    },
    {
      id: "view",
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      onClick: (product) => {
        router.push(`/store/product/${product._id}`);
      },
      variant: "outline",
    },
  ];

  // Header actions
  const headerActions = (
    <Button asChild>
      <Link href="/admin/store/products/create">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Product
      </Link>
    </Button>
  );

  return (
    <div className="container py-6">
      <EntityList<ProductItem>
        data={products ?? []}
        columns={columns}
        filters={filters}
        isLoading={isLoading}
        title="Products Management"
        description="Manage your products, pricing, and inventory"
        entityActions={entityActions}
        actions={headerActions}
        defaultViewMode="list"
        viewModes={["list", "grid"]}
        emptyState={
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Package className="mb-2 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-medium">No products found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Get started by adding your first product
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/store/products/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
