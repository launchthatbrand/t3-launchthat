"use client";

import * as React from "react";
import { useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/ui/table";

type PlatformUserRow = {
  clerkId: string;
  email: string;
  name?: string;
};

const kindVariant = (kind: string): "secondary" | "outline" => {
  if (kind.includes("error")) return "outline";
  return "secondary";
};

export default function PlatformAffiliatesLogsPage() {
  const logs = useQuery(api.platform.affiliates.listLogs, { limit: 250 });
  const users = useQuery(api.coreTenant.platformUsers.listUsers, { limit: 500 }) as
    | PlatformUserRow[]
    | undefined;

  const usersById = React.useMemo(() => {
    const m = new Map<string, PlatformUserRow>();
    for (const u of Array.isArray(users) ? users : []) {
      if (typeof u?.clerkId === "string") m.set(u.clerkId, u);
    }
    return m;
  }, [users]);

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
                    <TableHead>Kind</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => {
                    const u = usersById.get(l.ownerUserId);
                    return (
                      <TableRow key={`${l.ownerUserId}:${l.ts}:${l.kind}`}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(l.ts).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={kindVariant(l.kind)}>{l.kind}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[320px]">
                          <div className="space-y-1">
                            <div className="truncate text-sm font-medium">
                              {u?.name ?? u?.email ?? "—"}
                            </div>
                            <div className="text-muted-foreground truncate text-xs">{u?.email ?? "—"}</div>
                            <div className="text-muted-foreground truncate font-mono text-xs">
                              {l.ownerUserId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{l.message}</TableCell>
                        <TableCell className="max-w-[520px]">
                          <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-md bg-muted/30 p-2 text-xs">
                            {l.data ? JSON.stringify(l.data, null, 2) : "—"}
                          </pre>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

