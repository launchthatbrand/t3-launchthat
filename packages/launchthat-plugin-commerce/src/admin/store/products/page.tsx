/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import type { Doc } from "@convex-config/_generated/dataModel";
import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useConvexAuth, useQuery } from "convex/react";
import { Edit, Eye, Package, PlusCircle } from "lucide-react";

import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { toast } from "@acme/ui/toast";

type ProductRow = Doc<"products"> & Record<string, unknown>;

export default function ProductsAdminPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();

  // Early return if auth is loading or user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("You must be logged in to access this page.");
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
            <p className="text-muted-foreground">
              {authLoading ? "Authenticating..." : "Redirecting to login..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AuthenticatedProductsPage router={router} />;
}

function AuthenticatedProductsPage({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) {
  const isAdminResult = useQuery(api.core.accessControl.queries.checkIsAdmin);

  useEffect(() => {
    if (isAdminResult === false) {
      toast.error("You are not authorized to view this page.");
      router.push("/dashboard");
    }
  }, [isAdminResult, router]);

  if (isAdminResult === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
            <p className="text-muted-foreground">Verifying admin status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminResult === false) {
    return (
      <div className="container p-8">
        <p className="text-muted-foreground text-center">Redirecting...</p>
      </div>
    );
  }

  // At this point, isAdminResult is true.
  return <ProductsContent router={router} />;
}

function ProductsContent({ router }: { router: ReturnType<typeof useRouter> }) {
  const productsResult = useQuery(
    api.ecommerce.products.queries.listProducts,
    {},
  );
  const products = productsResult ?? [];
  const isLoading = productsResult === undefined;

  const formatPrice = (price: number) => `$${(price / 100).toFixed(2)}`;

  const columns = useMemo<ColumnDefinition<ProductRow>[]>(() => {
    return [
      {
        id: "name",
        header: "Product Name",
        accessorKey: "name",
        sortable: true,
        cell: (product: ProductRow) => (
          <div className="flex items-center">
            {product.images && product.images.length > 0 ? (
              <Image
                src={
                  product.images.find((img) => img.isPrimary)?.url ??
                  product.images[0]?.url ??
                  "/placeholder.jpg"
                }
                alt={product.name}
                className="mr-3 h-10 w-10 rounded-md object-cover"
                width={40}
                height={40}
              />
            ) : (
              <div className="bg-muted mr-3 flex h-10 w-10 items-center justify-center rounded-md">
                <Package className="text-muted-foreground h-5 w-5" />
              </div>
            )}
            <span className="font-medium">{product.name}</span>
          </div>
        ),
      },
      {
        id: "price",
        header: "Price",
        accessorKey: "price",
        sortable: true,
        cell: (product: ProductRow) => (
          <div>
            {product.salePrice ? (
              <div>
                <span className="text-muted-foreground text-sm line-through">
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
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        sortable: true,
        cell: (product: ProductRow) => {
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
            variant: "outline" as const,
          };

          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
      },
      {
        id: "type",
        header: "Type",
        accessorKey: "isDigital",
        sortable: true,
        cell: (product: ProductRow) => (
          <Badge variant="outline">
            {product.isDigital ? "Digital" : "Physical"}
          </Badge>
        ),
      },
      {
        id: "inventory",
        header: "Inventory",
        accessorKey: "stockQuantity",
        sortable: true,
        cell: (product: ProductRow) =>
          typeof product.stockQuantity === "number" ? (
            product.stockQuantity
          ) : (
            <span className="text-muted-foreground">N/A</span>
          ),
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        sortable: true,
        cell: (product: ProductRow) =>
          new Date(product.createdAt).toLocaleDateString(),
      },
    ];
  }, []);

  const filters = useMemo<FilterConfig<ProductRow>[]>(() => {
    return [
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
  }, []);

  const entityActions = useMemo<EntityAction<ProductRow>[]>(() => {
    return [
      {
        id: "edit",
        label: "Edit",
        icon: <Edit className="h-4 w-4" />,
        onClick: (product) =>
          router.push(`/admin/store/products/${product._id}`),
        variant: "outline",
      },
      {
        id: "view",
        label: "View",
        icon: <Eye className="h-4 w-4" />,
        onClick: (product) => router.push(`/store/product/${product._id}`),
        variant: "outline",
      },
    ];
  }, [router]);

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
      <EntityList<ProductRow>
        data={products}
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
            <Package className="text-muted-foreground mb-2 h-12 w-12" />
            <h3 className="mb-1 text-lg font-medium">No products found</h3>
            <p className="text-muted-foreground mb-4 text-sm">
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
