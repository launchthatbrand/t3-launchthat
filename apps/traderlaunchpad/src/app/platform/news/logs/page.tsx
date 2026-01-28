"use client";

import * as React from "react";
import { useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/ui/table";
import Link from "next/link";

type RunRow = {
  _id: string;
  startedAt: number;
  endedAt?: number;
  ok?: boolean;
  sourceKey: string;
  kind: string;
  createdRaw?: number;
  createdEvents?: number;
  updatedEvents?: number;
  dedupedEvents?: number;
  symbolLinksWritten?: number;
  lastError?: string;
};

const okVariant = (ok: boolean | undefined): "secondary" | "destructive" | "outline" => {
  if (ok === true) return "secondary";
  if (ok === false) return "destructive";
  return "outline";
};

export default function PlatformNewsLogsPage() {
  const runs = useQuery(api.platform.newsLogs.listRecentRuns, { limit: 200 }) as
    | RunRow[]
    | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Latest ingestion runs (cron + manual “Run now”).
        </div>
        <Link
          href="/platform/news/sync"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sync
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">News ingest runs</CardTitle>
        </CardHeader>
        <CardContent>
          {!runs ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : runs.length === 0 ? (
            <div className="text-muted-foreground text-sm">No runs yet.</div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>OK</TableHead>
                    <TableHead>sourceKey</TableHead>
                    <TableHead>kind</TableHead>
                    <TableHead>createdRaw</TableHead>
                    <TableHead>createdEvents</TableHead>
                    <TableHead>deduped</TableHead>
                    <TableHead>symbols</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(r.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={okVariant(r.ok)}>
                          {r.ok === true ? "ok" : r.ok === false ? "error" : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.sourceKey}</TableCell>
                      <TableCell className="text-xs">{r.kind}</TableCell>
                      <TableCell className="text-xs">{r.createdRaw ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.createdEvents ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.dedupedEvents ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.symbolLinksWritten ?? "—"}</TableCell>
                      <TableCell className="max-w-[520px]">
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {r.lastError ?? "—"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

