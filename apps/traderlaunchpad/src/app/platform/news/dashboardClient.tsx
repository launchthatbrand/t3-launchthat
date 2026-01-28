"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface RunRow {
  _id: string;
  startedAt: number;
  ok?: boolean;
  sourceKey: string;
  kind: string;
  createdRaw?: number;
  createdEvents?: number;
  dedupedEvents?: number;
  symbolLinksWritten?: number;
  lastError?: string;
}

const okVariant = (ok: boolean | undefined): "secondary" | "destructive" | "outline" => {
  if (ok === true) return "secondary";
  if (ok === false) return "destructive";
  return "outline";
};

export default function PlatformNewsDashboardClient() {
  const runs = useQuery(api.platform.newsLogs.listRecentRuns, { limit: 25 }) as
    | RunRow[]
    | undefined;

  const last = runs && runs.length > 0 ? runs[0] : null;
  const okCount = runs ? runs.filter((r) => r.ok === true).length : 0;
  const errCount = runs ? runs.filter((r) => r.ok === false).length : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last run</CardTitle>
          </CardHeader>
          <CardContent>
            {!last ? (
              <div className="text-sm text-muted-foreground">No runs yet.</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={okVariant(last.ok)}>
                    {last.ok === true ? "ok" : last.ok === false ? "error" : "—"}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs">
                    {last.kind}
                  </Badge>
                </div>
                <div className="font-mono text-xs text-muted-foreground">{last.sourceKey}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(last.startedAt).toLocaleString()}
                </div>
                {last.lastError ? (
                  <div className="text-xs text-red-600 line-clamp-2">{last.lastError}</div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                ok: {runs ? okCount : "—"}
              </Badge>
              <Badge variant={errCount > 0 ? "destructive" : "outline"} className="text-xs">
                errors: {runs ? errCount : "—"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                total: {runs ? runs.length : "—"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              View full details in{" "}
              <Link href="/platform/news/logs" className="underline underline-offset-4">
                Logs
              </Link>
              .
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link href="/platform/news/sync" className="block text-muted-foreground hover:text-foreground">
              Configure sources / run now →
            </Link>
            <Link href="/platform/news/logs" className="block text-muted-foreground hover:text-foreground">
              View ingest logs →
            </Link>
            <Link href="/news" className="block text-muted-foreground hover:text-foreground">
              View public news feed →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

