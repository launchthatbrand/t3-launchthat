"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React from "react";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { DashboardMetricCard } from "~/components/admin/DashboardMetricCard";

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const formatDateTime = (value: number) => new Date(value).toLocaleString();

export const EcommerceDashboardMetaBox = ({
  organizationId,
}: {
  organizationId: Id<"organizations">;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const apiAny = api as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const getDashboardSummaryQuery = apiAny.plugins.commerce.orders.queries.getDashboardSummary;

  const data = useQuery(getDashboardSummaryQuery, {
    organizationId: String(organizationId),
  }) as
    | {
        revenue7d: number;
        orders7d: number;
        revenue30d: number;
        orders30d: number;
        latestOrders: {
          id: string;
          createdTime: number;
          total: number;
          email?: string;
        }[];
      }
    | undefined;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <DashboardMetricCard
          title="Last 7 days"
          value={formatCurrency(data?.revenue7d ?? 0)}
          subtitle={`${data?.orders7d ?? 0} orders`}
        />
        <DashboardMetricCard
          title="Last 30 days"
          value={formatCurrency(data?.revenue30d ?? 0)}
          subtitle={`${data?.orders30d ?? 0} orders`}
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Latest orders</div>
        {data === undefined ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : data.latestOrders.length === 0 ? (
          <div className="text-muted-foreground text-sm">No orders yet.</div>
        ) : (
          <div className="divide-y rounded-md border">
            {data.latestOrders.map((order) => (
              <a
                key={order.id}
                href={`/admin/edit?post_type=orders&post_id=${encodeURIComponent(order.id)}`}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {order.email ?? order.id}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatDateTime(order.createdTime)}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-sm">
                  {formatCurrency(order.total)}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


