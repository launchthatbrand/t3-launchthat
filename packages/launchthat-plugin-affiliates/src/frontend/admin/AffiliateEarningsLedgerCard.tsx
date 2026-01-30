"use client";

import * as React from "react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { ColumnDefinition } from "@acme/ui/entity-list";
import { EntityList } from "@acme/ui/entity-list";

import type { AffiliateCreditEventRow, AffiliateTopLandingPaths } from "./types";
import { formatUsd, stripClerkIssuerPrefix } from "./utils";

export const AffiliateEarningsLedgerCard = (props: {
  creditRows: AffiliateCreditEventRow[];
  isLoading: boolean;
  topPaths?: AffiliateTopLandingPaths;
}) => {
  const columns = React.useMemo<ColumnDefinition<AffiliateCreditEventRow>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        accessorKey: "createdAt",
        cell: (e: AffiliateCreditEventRow) => (
          <div className="whitespace-nowrap text-xs">
            {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
          </div>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        accessorKey: "amountCents",
        cell: (e: AffiliateCreditEventRow) => (
          <div className="space-y-1">
            <div className="font-mono text-xs">
              {formatUsd(e.amountCents)} {e.currency}
            </div>
            <div className="text-muted-foreground text-[10px]">
              {e.kind === "commission_direct"
                ? "Direct commission"
                : e.kind === "commission_sponsor_override"
                  ? `Sponsor override (child: ${stripClerkIssuerPrefix(String(e.referrerUserId ?? ""))})`
                  : (e.kind ?? "—")}
            </div>
          </div>
        ),
      },
      {
        id: "reason",
        header: "Reason",
        accessorKey: "reason",
        cell: (e: AffiliateCreditEventRow) => (
          <div className="space-y-1 text-sm">
            <div className="font-medium">{e.reason}</div>
            <div className="text-muted-foreground text-xs font-mono">
              {e.referredUserId ? stripClerkIssuerPrefix(e.referredUserId) : "—"}
            </div>
            {e.externalEventId ? (
              <div className="text-muted-foreground text-[10px] font-mono">
                {String(e.externalEventId)}
              </div>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-base">Earnings ledger</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {props.topPaths ? (
          <div className="mb-3 rounded-lg border bg-card p-3">
            <div className="text-muted-foreground text-xs">
              Top landing paths (last {props.topPaths.daysBack}d)
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {props.topPaths.topLandingPaths.length ? (
                props.topPaths.topLandingPaths.map((p) => (
                  <Badge key={p.path} variant="secondary">
                    {p.path} · {p.clicks}
                  </Badge>
                ))
              ) : (
                <div className="text-muted-foreground text-xs">No click data yet.</div>
              )}
            </div>
          </div>
        ) : null}

        <EntityList
          data={props.creditRows}
          columns={columns}
          isLoading={props.isLoading}
          defaultViewMode="list"
          viewModes={[]}
          enableSearch={true}
          getRowId={(e) => `${e.createdAt}:${e.reason}:${e.amountCents}`}
          emptyState={<div className="text-muted-foreground text-sm">No credit events yet.</div>}
        />
      </CardContent>
    </Card>
  );
};

