"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";

type OrderRow = {
  _id: string;
  _creationTime: number;
  status: string;
  total: number;
  currency: string;
  email?: string;
  itemsCount?: number;
};

const formatMoney = (amount: number, currency: string) => {
  const safe = Number.isFinite(amount) ? amount : 0;
  const code = (currency || "USD").toUpperCase();
  const symbol = code === "USD" ? "$" : `${code} `;
  return `${symbol}${safe.toFixed(2)}`;
};

export function EcommerceAccountOrdersTab() {
  return <EcommerceAccountOrdersTabInner />;
}

export function EcommerceAccountOrdersTabInner(props?: {
  organizationId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedOrderId = searchParams.get("orderId") ?? "";

  const orders = useQuery(
    (api.plugins.commerce.orders.queries as any).listMyOrders,
    props?.organizationId ? { organizationId: props.organizationId } : {},
  ) as OrderRow[] | undefined;

  const columns: ColumnDefinition<OrderRow>[] = [
    {
      id: "_id",
      header: "Order",
      accessorKey: "_id",
      sortable: true,
      cell: (row: OrderRow) => (
        <span className="font-medium">Order {row._id}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (row: OrderRow) => (
        <Badge variant="secondary" className="capitalize">
          {row.status || "unknown"}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      header: "Date",
      sortable: true,
      cell: (row: OrderRow) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row._creationTime).toLocaleString()}
        </span>
      ),
    },
    {
      id: "total",
      header: "Total",
      sortable: true,
      cell: (row: OrderRow) => (
        <span className="font-semibold">
          {formatMoney(row.total, row.currency)}
        </span>
      ),
    },
  ];

  const selectedOrder = useQuery(
    (api.plugins.commerce.orders.queries as any).getMyOrder,
    selectedOrderId
      ? {
          orderId: selectedOrderId,
          ...(props?.organizationId
            ? { organizationId: props.organizationId }
            : {}),
        }
      : "skip",
  ) as
    | {
        _id: string;
        _creationTime: number;
        status: string;
        total: number;
        currency: string;
        items: Array<{ title?: string; quantity?: number; unitPrice?: number }>;
        email?: string;
      }
    | null
    | undefined;

  const openOrder = (orderId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "orders");
    next.set("orderId", orderId);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const closeOrder = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("orderId");
    next.set("tab", "orders");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedOrderId ? (
            selectedOrder === undefined ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : selectedOrder === null ? (
              <div className="space-y-3">
                <div className="text-muted-foreground text-sm">
                  Order not found.
                </div>
                <Button type="button" variant="outline" onClick={closeOrder}>
                  Back to orders
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button type="button" variant="outline" onClick={closeOrder}>
                    Back
                  </Button>
                  <Badge variant="secondary" className="capitalize">
                    {selectedOrder.status || "unknown"}
                  </Badge>
                </div>

                <div className="rounded-md border p-4">
                  <div className="text-sm font-semibold">Summary</div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {new Date(selectedOrder._creationTime).toLocaleString()}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">Total</div>
                    <div className="text-sm font-semibold">
                      {formatMoney(selectedOrder.total, selectedOrder.currency)}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="text-sm font-semibold">Items</div>
                  <Separator className="my-3" />
                  {Array.isArray(selectedOrder.items) &&
                  selectedOrder.items.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => {
                        const title =
                          typeof item.title === "string" && item.title.trim()
                            ? item.title
                            : "Item";
                        const qty =
                          typeof item.quantity === "number" ? item.quantity : 1;
                        const unit =
                          typeof item.unitPrice === "number"
                            ? item.unitPrice
                            : 0;
                        return (
                          <div
                            key={`${title}-${idx}`}
                            className="flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {title}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Qty {qty}
                              </div>
                            </div>
                            <div className="text-sm font-semibold">
                              {formatMoney(unit * qty, selectedOrder.currency)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">—</div>
                  )}
                </div>
              </div>
            )
          ) : orders === undefined ? (
            <EntityList<OrderRow>
              title="Past orders"
              description="Click an order to view details."
              data={[]}
              columns={columns}
              isLoading
              viewModes={["list"]}
              enableSearch
              hideFilters
            />
          ) : (
            <EntityList<OrderRow>
              title="Past orders"
              description="Click an order to view details."
              data={orders}
              columns={columns}
              isLoading={false}
              viewModes={["list"]}
              enableSearch
              hideFilters
              onRowClick={(row) => openOrder(row._id)}
              selectedId={selectedOrderId || null}
              emptyState={
                <div className="text-muted-foreground text-sm">
                  You don’t have any orders yet.
                </div>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}