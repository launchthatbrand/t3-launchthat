"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Ban, Search, Shield, Trash2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

type ConnStatus = "active" | "disabled" | "revoked";
type ConnectionRow = {
  id: string;
  clientId: string;
  clientName: string;
  userId: string;
  portalOrg: string;
  env: "production" | "staging";
  status: ConnStatus;
  lastUsedAt: string;
  createdAt: string;
};

const CONNECTIONS: ConnectionRow[] = [
  {
    id: "pc_mock_001",
    clientId: "portal_mock",
    clientName: "Portal",
    userId: "u_002",
    portalOrg: "LaunchThat (Demo Org)",
    env: "production",
    status: "active",
    lastUsedAt: "2m ago",
    createdAt: "Jan 16, 2026",
  },
  {
    id: "pc_mock_002",
    clientId: "portal_mock",
    clientName: "Portal",
    userId: "u_003",
    portalOrg: "Second Org (Sandbox)",
    env: "staging",
    status: "disabled",
    lastUsedAt: "3w ago",
    createdAt: "Dec 29, 2025",
  },
  {
    id: "pc_mock_003",
    clientId: "portal_mock",
    clientName: "Portal",
    userId: "u_004",
    portalOrg: "Acme Org",
    env: "production",
    status: "revoked",
    lastUsedAt: "—",
    createdAt: "Nov 2, 2025",
  },
];

const statusBadgeClass = (s: ConnStatus) => {
  if (s === "active")
    return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10";
  if (s === "disabled")
    return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10";
  return "bg-muted text-muted-foreground hover:bg-muted";
};

export default function PlatformIntegrationsConnectionsPage() {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CONNECTIONS;
    return CONNECTIONS.filter((c) =>
      [c.id, c.userId, c.portalOrg, c.clientName, c.env, c.status]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Connections</h2>
          <p className="text-muted-foreground text-sm">
            Global list of OAuth connections across users and Portal orgs
            (mock).
          </p>
        </div>
        <div className="flex w-full max-w-md items-center gap-2">
          <div className="relative w-full">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by user, org, connection id…"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base">All connections</CardTitle>
          <CardDescription>
            Use this table to disable or revoke access when needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connection</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Portal org</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell>
                    <Link
                      href={`/platform/integrations/connection/${encodeURIComponent(c.id)}`}
                      className="hover:underline"
                    >
                      <div className="font-mono text-sm">{c.id}</div>
                      <div className="text-muted-foreground text-xs">
                        Created {c.createdAt} • Last used {c.lastUsedAt}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold">{c.clientName}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {c.clientId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/platform/user/${encodeURIComponent(c.userId)}/oauth`}
                      className="font-mono text-sm hover:underline"
                    >
                      {c.userId}
                    </Link>
                    <div className="text-muted-foreground text-xs">{c.env}</div>
                  </TableCell>
                  <TableCell className="text-sm">{c.portalOrg}</TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClass(c.status)}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/platform/integrations/connection/${encodeURIComponent(c.id)}`}
                        >
                          Open <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-amber-500 hover:bg-amber-50 hover:text-amber-600"
                      >
                        <Ban className="h-4 w-4" />
                        Disable
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-muted-foreground flex items-start gap-2 text-xs">
        <Shield className="mt-0.5 h-4 w-4 text-purple-500" />
        <div>
          Backend later: `connections` table (status, scopes, token hashes),
          revocation flow, and audit trails for every moderation action.
        </div>
      </div>
    </div>
  );
}
