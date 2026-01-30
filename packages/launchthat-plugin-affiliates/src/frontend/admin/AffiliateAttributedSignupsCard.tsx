"use client";

import * as React from "react";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import { EntityList } from "@acme/ui/entity-list";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { AffiliateRecruitRow } from "./types";

export const AffiliateAttributedSignupsCard = (props: {
  rows: AffiliateRecruitRow[];
  isLoading: boolean;
}) => {
  const columns = React.useMemo<ColumnDefinition<AffiliateRecruitRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        cell: (r: AffiliateRecruitRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{r.name}</div>
            <div className="text-muted-foreground text-xs font-mono">{r.referredUserId}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "date",
        header: "Recruited",
        accessorKey: "attributedAt",
        cell: (r: AffiliateRecruitRow) => (
          <div className="whitespace-nowrap text-xs">
            {r.attributedAt ? new Date(r.attributedAt).toLocaleDateString() : "—"}
          </div>
        ),
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "activatedAt",
        cell: (r: AffiliateRecruitRow) => (
          <div className="flex flex-wrap items-center gap-2">
            {typeof r.activatedAt === "number" ? (
              <Badge variant="secondary">activated</Badge>
            ) : (
              <Badge variant="outline">pending</Badge>
            )}
            {typeof r.firstPaidConversionAt === "number" ? <Badge>paid</Badge> : null}
          </div>
        ),
      },
      {
        id: "paidAt",
        header: "Paid",
        accessorKey: "firstPaidConversionAt",
        cell: (r: AffiliateRecruitRow) => (
          <div className="whitespace-nowrap text-xs">
            {typeof r.firstPaidConversionAt === "number"
              ? new Date(r.firstPaidConversionAt).toLocaleDateString()
              : "—"}
          </div>
        ),
        sortable: true,
      },
    ],
    [],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-base">Attributed signups</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="text-muted-foreground mb-3 text-xs">
          Users attributed to your referral code during signup (marketing attribution window).
        </div>
        <EntityList
          data={props.rows}
          columns={columns}
          isLoading={props.isLoading}
          defaultViewMode="list"
          viewModes={[]}
          enableSearch={true}
          getRowId={(r) => r.referredUserId}
          emptyState={
            <div className="text-muted-foreground text-sm">
              No recruits yet. Share your referral link to start earning.
            </div>
          }
        />
      </CardContent>
    </Card>
  );
};

