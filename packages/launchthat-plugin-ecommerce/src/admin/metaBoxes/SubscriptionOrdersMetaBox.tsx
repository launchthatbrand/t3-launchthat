"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useMemo } from "react";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import { Badge } from "@acme/ui/badge";
import { EntityList } from "@acme/ui/entity-list";

type SubscriptionOrderRow = {
  id: string;
  createdAtMs: number;
  status: string;
  totalAmount: number | null;
  currency: string;
  href: string;
};

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const formatCurrency = (amount: number | null, currency: string): string => {
  if (amount === null) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || "USD"}`;
  }
};

export function SubscriptionOrdersMetaBox({
  context,
  getValue,
}: PluginMetaBoxRendererProps) {
  const organizationId =
    typeof context.organizationId === "string" ? context.organizationId : null;
  const subscriptionId = asString(context.postId || "").trim();

  // NOTE: @portal/convexspec types may lag behind newly added Convex routes.
  // Use an erased reference to keep package builds unblocked.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const listOrdersForSubscriptionQuery = (api as any).plugins.commerce
    .subscriptions.queries.listOrdersForSubscription as any;

  const rowsQuery = useQuery(
    listOrdersForSubscriptionQuery,
    organizationId && subscriptionId
      ? { organizationId, subscriptionId }
      : "skip",
  ) as
    | Array<{
        id: string;
        createdAtMs: number;
        status: string;
        totalAmount?: number | null;
        totalCents?: number | null;
        currency: string;
      }>
    | undefined;

  const rows = useMemo((): SubscriptionOrderRow[] => {
    const list = Array.isArray(rowsQuery) ? rowsQuery : [];
    return list
      .map((row) => {
        const id = asString(row.id).trim();
        if (!id) return null;
        const createdAtMs = asNumber(row.createdAtMs) ?? Date.now();
        const status = asString(row.status) || "unknown";
        const totalAmount = asNumber(
          (row as any).totalAmount ?? (row as any).totalCents,
        );
        const currency = asString(row.currency) || "USD";
        return {
          id,
          createdAtMs,
          status,
          totalAmount,
          currency,
          href: `/admin/edit?post_type=orders&post_id=${id}`,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [rowsQuery]);

  const columns: Array<ColumnDefinition<SubscriptionOrderRow>> = [
    {
      id: "order",
      header: "Order",
      cell: (item: SubscriptionOrderRow) => (
        <Link className="text-primary hover:underline" href={item.href}>
          {item.id}
        </Link>
      ),
    },
    {
      id: "created",
      header: "Created",
      cell: (item: SubscriptionOrderRow) =>
        new Date(item.createdAtMs).toLocaleString(),
    },
    {
      id: "status",
      header: "Status",
      cell: (item: SubscriptionOrderRow) => (
        <Badge variant="secondary">{item.status}</Badge>
      ),
    },
    {
      id: "total",
      header: "Total",
      cell: (item: SubscriptionOrderRow) =>
        formatCurrency(item.totalAmount, item.currency),
    },
  ];

  const productId = asString(getValue("subscription.productId")).trim();

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground text-sm">
        Orders created by this subscription. (Product:{" "}
        <span className="font-mono">{productId || "—"}</span>)
      </div>
      <EntityList<SubscriptionOrderRow>
        data={rows}
        columns={columns}
        isLoading={
          organizationId !== null &&
          subscriptionId !== "" &&
          rowsQuery === undefined
        }
        enableSearch={false}
        enableFooter={false}
        defaultViewMode="list"
        viewModes={["list"]}
        emptyState={
          <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
            No subscription orders yet.
          </div>
        }
      />
    </div>
  );
}
