"use client";

import * as React from "react";
import { useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/ui/table";

const levelVariant = (level: string): "secondary" | "outline" | "destructive" => {
  if (level === "error") return "destructive";
  if (level === "warn") return "outline";
  return "secondary";
};

export default function PlatformDataLogsPage() {
  const logs = useQuery(api.platform.priceDataLogs.listRecentLogs, { limit: 200 });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest events</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="text-muted-foreground text-sm">No logs yet.</div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l._id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(l.ts).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={levelVariant(l.level)}>{l.level}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{String(l.jobId)}</TableCell>
                      <TableCell className="text-sm">{l.message}</TableCell>
                      <TableCell className="max-w-[520px]">
                        <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-md bg-muted/30 p-2 text-xs">
                          {l.data ? JSON.stringify(l.data, null, 2) : "—"}
                        </pre>
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

