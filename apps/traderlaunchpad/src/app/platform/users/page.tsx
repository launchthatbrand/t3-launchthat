"use client";

import React from "react";
import Link from "next/link";
import {
  Filter,
  MoreHorizontal,
  Search,
  Shield,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "trial" | "past_due" | "canceled";
  createdAt: string;
  lastSeen: string;
}

const USERS: UserRow[] = [
  {
    id: "u_001",
    name: "Desmond T.",
    email: "desmond@example.com",
    role: "admin",
    status: "active",
    createdAt: "Jan 02, 2026",
    lastSeen: "2m ago",
  },
  {
    id: "u_002",
    name: "Mike R.",
    email: "mike@example.com",
    role: "user",
    status: "trial",
    createdAt: "Jan 15, 2026",
    lastSeen: "1h ago",
  },
  {
    id: "u_003",
    name: "Sarah K.",
    email: "sarah@example.com",
    role: "user",
    status: "active",
    createdAt: "Dec 28, 2025",
    lastSeen: "Yesterday",
  },
  {
    id: "u_004",
    name: "Alex P.",
    email: "alex@example.com",
    role: "user",
    status: "past_due",
    createdAt: "Dec 10, 2025",
    lastSeen: "3d ago",
  },
  {
    id: "u_005",
    name: "Jordan M.",
    email: "jordan@example.com",
    role: "user",
    status: "canceled",
    createdAt: "Nov 18, 2025",
    lastSeen: "2w ago",
  },
];

const statusBadgeClass = (status: UserRow["status"]) => {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10";
    case "trial":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/10";
    case "past_due":
      return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10";
    case "canceled":
      return "bg-muted text-muted-foreground hover:bg-muted";
    default:
      return "bg-muted text-muted-foreground hover:bg-muted";
  }
};

export default function PlatformUsersPage() {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return USERS;
    return USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users and roles (mock data).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button className="gap-2 border-0 bg-blue-600 text-white hover:bg-blue-700">
            <UserPlus className="h-4 w-4" />
            Invite user
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <CardTitle className="text-base">Directory</CardTitle>
            <div className="relative w-full sm:w-96">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, status, role…"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="group hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                          {u.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{u.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={cn(
                        "gap-1",
                        u.role === "admin"
                          ? "bg-purple-500/10 text-purple-500 hover:bg-purple-500/10"
                          : "bg-muted text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {u.role === "admin" ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Shield className="h-3.5 w-3.5" />
                      )}
                      {u.role}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={statusBadgeClass(u.status)}>
                      {u.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm">{u.createdAt}</TableCell>
                  <TableCell className="text-sm">{u.lastSeen}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/platform/user/${encodeURIComponent(u.id)}`}
                          >
                            View profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="#">Promote to admin</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="#">Deactivate</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filtered.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">
              No users match your search.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
