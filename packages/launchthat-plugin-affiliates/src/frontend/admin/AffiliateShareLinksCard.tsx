"use client";

import * as React from "react";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import { EntityList } from "@acme/ui/entity-list";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { AffiliateShareLinkRow } from "./types";
import { formatUsd } from "./utils";

export const AffiliateShareLinksCard = (props: {
  baseOrigin: string;
  rows: AffiliateShareLinkRow[];
  isLoading: boolean;
  onCopy: (text: string) => void;
}) => {
  const columns = React.useMemo<
    ColumnDefinition<
      AffiliateShareLinkRow & { urlComputed: string }
    >[]
  >(
    () => [
      {
        id: "url",
        header: "Link",
        accessorKey: "code",
        cell: (r: AffiliateShareLinkRow & { urlComputed: string }) => (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-mono text-xs">{r.urlComputed}</div>
              <div className="text-muted-foreground truncate text-[10px]">{r.path}</div>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => props.onCopy(r.urlComputed)}>
              Copy
            </Button>
          </div>
        ),
      },
      {
        id: "campaign",
        header: "Campaign",
        accessorKey: "campaign",
        cell: (r: AffiliateShareLinkRow) => <div className="text-xs">{r.campaign || "—"}</div>,
      },
      {
        id: "template",
        header: "Template",
        accessorKey: "templateId",
        cell: (r: AffiliateShareLinkRow) => <div className="text-xs">{r.templateId || "—"}</div>,
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        cell: (r: AffiliateShareLinkRow) => (
          <div className="whitespace-nowrap text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</div>
        ),
        sortable: true,
      },
      {
        id: "clicks",
        header: "Clicks",
        accessorKey: "clickCount",
        cell: (r: AffiliateShareLinkRow) => <div className="text-xs">{typeof r.clickCount === "number" ? r.clickCount : 0}</div>,
        sortable: true,
      },
      {
        id: "signups",
        header: "Signups",
        accessorKey: "signups",
        cell: (r: AffiliateShareLinkRow) => <div className="text-xs">{r.signups}</div>,
        sortable: true,
      },
      {
        id: "paid",
        header: "Paid",
        accessorKey: "paid",
        cell: (r: AffiliateShareLinkRow) => <div className="text-xs">{r.paid}</div>,
        sortable: true,
      },
      {
        id: "earnings",
        header: "Earnings",
        accessorKey: "earningsCents",
        cell: (r: AffiliateShareLinkRow) => <div className="font-mono text-xs">{formatUsd(r.earningsCents)}</div>,
        sortable: true,
      },
      {
        id: "lastAccessAt",
        header: "Last clicked",
        accessorKey: "lastAccessAt",
        cell: (r: AffiliateShareLinkRow) => (
          <div className="whitespace-nowrap text-xs">
            {typeof r.lastAccessAt === "number" && r.lastAccessAt > 0 ? new Date(r.lastAccessAt).toLocaleString() : "—"}
          </div>
        ),
        sortable: true,
      },
    ],
    [props],
  );

  const data = React.useMemo(() => {
    return props.rows.map((r) => ({
      ...r,
      urlComputed: r.url ?? `${props.baseOrigin}/s/${r.code}`,
    }));
  }, [props.baseOrigin, props.rows]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-base">Your share links</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <EntityList
          data={data}
          columns={columns}
          isLoading={props.isLoading}
          defaultViewMode="list"
          viewModes={[]}
          enableSearch={true}
          getRowId={(r) => r.code}
          emptyState={
            <div className="text-muted-foreground text-sm">
              No share links yet. Generate one from the Share kit to start tracking per-post clicks.
            </div>
          }
        />
      </CardContent>
    </Card>
  );
};

