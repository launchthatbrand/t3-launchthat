"use client";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unnecessary-type-assertion,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/prefer-optional-chain,
  @typescript-eslint/no-unnecessary-condition
*/

import React from "react";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Badge } from "@acme/ui/badge";

const tlApi = require("@/convex/_generated/api") as any;
const tlQueries = tlApi.api.plugins.traderlaunchpad.queries as any;

export function TraderLaunchpadPublicJournalPage(props: {
  username: string;
  subroute: string;
}) {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);

  const publicProfile = useQuery(
    tlQueries.getPublicJournalProfileByUsername,
    organizationId
      ? { username: props.username, organizationId }
      : { username: props.username },
  ) as
    | { isPublic: boolean; userId: string; organizationId: string | null }
    | null
    | undefined;

  const positions = useQuery(
    tlQueries.listPublicPositionsByUsername,
    organizationId ? { username: props.username, organizationId, limit: 50 } : "skip",
  ) as
    | {
        externalPositionId: string;
        symbol?: string;
        side?: "buy" | "sell";
        qty?: number;
        avgPrice?: number;
        openedAt?: number;
        updatedAt: number;
      }[]
    | undefined;

  const tradeIdeasOpen = useQuery(
    tlQueries.listPublicTradeIdeasByUsername,
    organizationId
      ? { username: props.username, organizationId, status: "open", limit: 20 }
      : "skip",
  ) as
    | {
        tradeIdeaGroupId: string;
        symbol: string;
        status: "open" | "closed";
        direction: "long" | "short";
        openedAt: number;
        netQty: number;
      }[]
    | undefined;

  if (publicProfile === undefined) {
    return (
      <div className="text-muted-foreground">Loading…</div>
    );
  }

  if (!publicProfile || !publicProfile.isPublic) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Journal is private</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This trader has disabled public viewing.
        </CardContent>
      </Card>
    );
  }

  const openPositionsCount = Array.isArray(positions) ? positions.length : 0;
  const openIdeasCount = Array.isArray(tradeIdeasOpen) ? tradeIdeasOpen.length : 0;

  const subroute = (props.subroute ?? "dashboard").toLowerCase();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open positions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {openPositionsCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open trade ideas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {openIdeasCount}
          </CardContent>
        </Card>
      </div>

      {subroute === "orders" || subroute === "dashboard" ? (
        <Card>
          <CardHeader>
            <CardTitle>Open positions</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(positions) && positions.length > 0 ? (
              <EntityList
                title=""
                description=""
                data={positions as any}
                viewModes={["list"]}
                hideFilters
                enableSearch={false}
                getRowId={(row: any) => String(row.externalPositionId)}
                columns={[
                  {
                    id: "symbol",
                    header: "Symbol",
                    accessorKey: "symbol",
                    cell: (row: any) => row.symbol ?? "—",
                  },
                  {
                    id: "side",
                    header: "Side",
                    accessorKey: "side",
                    cell: (row: any) =>
                      row.side === "buy" ? "Long" : row.side === "sell" ? "Short" : "—",
                  },
                  {
                    id: "qty",
                    header: "Qty",
                    accessorKey: "qty",
                    cell: (row: any) =>
                      typeof row.qty === "number" ? row.qty : "—",
                  },
                  {
                    id: "avgPrice",
                    header: "Avg",
                    accessorKey: "avgPrice",
                    cell: (row: any) =>
                      typeof row.avgPrice === "number" ? row.avgPrice : "—",
                  },
                ]}
              />
            ) : (
              <div className="text-muted-foreground text-sm">
                No open positions.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {subroute === "ideas" || subroute === "dashboard" ? (
        <Card>
          <CardHeader>
            <CardTitle>Trade ideas (open)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.isArray(tradeIdeasOpen) && tradeIdeasOpen.length > 0 ? (
              <div className="space-y-2">
                {tradeIdeasOpen.map((g) => (
                  <div
                    key={g.tradeIdeaGroupId}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{g.symbol}</div>
                      <Badge variant="outline">
                        {g.direction === "short" ? "Short" : "Long"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      Net qty: {g.netQty}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No open trade ideas yet.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}


