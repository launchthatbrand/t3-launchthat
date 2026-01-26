"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Input } from "@acme/ui/input";

import { useContacts } from "../hooks/useContacts";
import type { ContactRow } from "../types";

type ContactsTableProps = {
  listContactsQuery: unknown;
  statusFilter?: string;
  limit?: number;
  detailHrefBase: string;
  createHref: string;
};

const filterContacts = (rows: ContactRow[], search: string) => {
  const term = search.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) => {
    const haystack = [
      row.title,
      row.slug,
      row.status,
      ...(Array.isArray(row.tags) ? row.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
};

export const ContactsTable = ({
  listContactsQuery,
  statusFilter,
  limit = 500,
  detailHrefBase,
  createHref,
}: ContactsTableProps) => {
  const [search, setSearch] = React.useState("");
  const rows = useContacts({
    listContactsQuery,
    status: statusFilter,
    limit,
  });

  const filtered = React.useMemo(() => {
    return Array.isArray(rows) ? filterContacts(rows, search) : [];
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search contacts..."
          className="max-w-sm"
        />
        <Button asChild className="bg-orange-600 text-white hover:bg-orange-700">
          <Link href={createHref}>New contact</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-sm">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <Link
                      href={`${detailHrefBase}/${row._id}`}
                      className="text-foreground font-medium hover:underline"
                    >
                      {row.title}
                    </Link>
                    <div className="text-muted-foreground text-xs">{row.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.status || "active"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(row.tags ?? []).length === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        (row.tags ?? []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
