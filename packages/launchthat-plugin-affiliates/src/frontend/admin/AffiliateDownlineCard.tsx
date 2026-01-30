"use client";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import { EntityList } from "@acme/ui/entity-list";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import * as React from "react";

import type { AffiliateDownlineRow } from "./types";
import { stripClerkIssuerPrefix } from "./utils";

export const AffiliateDownlineCard = (props: {
  rows: AffiliateDownlineRow[];
  isLoading: boolean;
}) => {
  const columns = React.useMemo<ColumnDefinition<AffiliateDownlineRow>[]>(
    () => [
      {
        id: "name",
        header: "User",
        accessorKey: "name",
        cell: (r: AffiliateDownlineRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{r.name}</div>
            <div className="text-muted-foreground text-xs font-mono">{stripClerkIssuerPrefix(r.userId)}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "joinedAt",
        header: "Joined",
        accessorKey: "joinedAt",
        cell: (r: AffiliateDownlineRow) => (
          <div className="whitespace-nowrap text-xs">{r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : "—"}</div>
        ),
        sortable: true,
      },
      {
        id: "source",
        header: "Source",
        accessorKey: "createdSource",
        cell: (r: AffiliateDownlineRow) => (
          <div className="text-muted-foreground text-xs">{r.createdSource || "—"}</div>
        ),
        sortable: true,
      },
    ],
    [],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-base">Network (MLM): direct downline</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="text-muted-foreground mb-3 text-xs">
          These users explicitly opted into joining your sponsor network. This is separate from signup attribution.
        </div>
        <EntityList
          data={props.rows}
          columns={columns}
          isLoading={props.isLoading}
          defaultViewMode="list"
          viewModes={[]}
          enableSearch={true}
          getRowId={(r) => r.userId}
          emptyState={<div className="text-muted-foreground text-sm">No direct downline yet.</div>}
        />
      </CardContent>
    </Card>
  );
};

