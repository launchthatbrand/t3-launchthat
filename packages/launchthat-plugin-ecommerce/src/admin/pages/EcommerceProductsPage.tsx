"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { toast } from "@acme/ui/toast";

const formatDate = (ts: number | null): string => {
  if (!ts || !Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

type ProductRow = {
  _id: string;
  title?: string;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
};

export function EcommerceProductsPage(props: {
  organizationId?: string | null;
  listProducts: unknown;
  createProduct: unknown;
  limit?: number;
  status?: "published" | "draft" | "archived";
}) {
  const organizationId =
    typeof props.organizationId === "string" ? props.organizationId : undefined;
  const limit = typeof props.limit === "number" ? props.limit : 100;
  const listProducts = props.listProducts as any;
  const createProduct = useMutation(props.createProduct as any) as (args: any) => Promise<string>;

  const products = useQuery(listProducts, {
    organizationId,
    limit,
    ...(props.status ? { status: props.status } : {}),
  }) as ProductRow[] | undefined;

  const rows = Array.isArray(products) ? products : [];

  const columns = React.useMemo<ColumnDefinition<ProductRow>[]>(
    () => [
      {
        id: "product",
        header: "Product",
        accessorKey: "title",
        cell: (row: ProductRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{row.title || "Product"}</div>
            <div className="text-muted-foreground text-xs">
              Updated{" "}
              {formatDate(
                typeof row.updatedAt === "number" ? row.updatedAt : null,
              )}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (row: ProductRow) => (
          <Badge variant="outline" className="uppercase">
            {row.status || "unknown"}
          </Badge>
        ),
      },
    ],
    [],
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState<"published" | "draft" | "archived">(
    "published",
  );
  const [saving, setSaving] = React.useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Enter a product title.");
      return;
    }
    setSaving(true);
    try {
      await createProduct({ organizationId, title, status });
      toast.success("Product created.");
      setTitle("");
      setStatus("published");
      setCreateOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create product.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Products</CardTitle>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <Button type="button" onClick={() => setCreateOpen(true)}>
                Add product
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-title">Title</Label>
                    <Input
                      id="product-title"
                      value={title}
                      onChange={(e) => setTitle(e.currentTarget.value)}
                      placeholder="Monthly Pro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-status">Status</Label>
                    <select
                      id="product-status"
                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.currentTarget.value as typeof status)
                      }
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreate} disabled={saving}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <EntityList
            data={rows}
            columns={columns}
            isLoading={products === undefined}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            getRowId={(row) => row._id}
            emptyState={
              <div className="text-muted-foreground text-sm">No products yet.</div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
