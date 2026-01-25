"use client";

import * as React from "react";

import { ArrowUpRight } from "lucide-react";
import { Badge } from "@acme/ui/badge";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

const toDateTimeLabel = (tsMs: number | null): string => {
  if (!tsMs) return "—";
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export default function PublicUserOrdersPage() {
  const params = useParams<{ username?: string }>();
  const decoded = decodeURIComponent(String(params.username ?? ""));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const orders = useQuery(api.traderlaunchpad.public.listPublicOrders, {
    username: decoded,
    limit: 50,
  }) as
    | {
      externalOrderId: string;
      symbol: string;
      side: "buy" | "sell" | null;
      status: string | null;
      createdAt: number | null;
      closedAt: number | null;
    }[]
    | undefined;

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/3 p-7 backdrop-blur-md">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white/85">Orders</div>
            <div className="mt-1 text-sm text-white/55">Recent orders from this user.</div>
          </div>
          <div className="text-xs text-white/50">{orders?.length ?? 0} orders</div>
        </div>

        <div className="mt-5 grid gap-3">
          {orders === undefined ? (
            <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-white/60">
              Loading…
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-white/60">
              No public orders yet.
            </div>
          ) : (
            orders.map((o) => {
              const isBuy = o.side === "buy";
              const typeLabel = o.side === "buy" ? "Buy" : o.side === "sell" ? "Sell" : "—";
              return (
                <Link
                  key={o.externalOrderId}
                  href={`/u/${encodeURIComponent(decoded)}/order/${encodeURIComponent(o.externalOrderId)}`}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-white/90">{o.symbol || "—"}</div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-white/15 text-[10px]",
                          isBuy ? "text-emerald-200" : "text-rose-200",
                        )}
                      >
                        {typeLabel}
                      </Badge>
                      <div className="text-xs text-white/45">{toDateTimeLabel(o.createdAt)}</div>
                    </div>
                    <div className="mt-1 text-xs text-white/55">{o.status ?? "—"}</div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-xs text-white/50">View</div>
                    <div className="mt-0.5 inline-flex items-center gap-2 text-xs text-white/60 group-hover:text-white">
                      Order <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="h-24" />
    </>
  );
}

