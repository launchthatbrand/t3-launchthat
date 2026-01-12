"use client";

import type { Id } from "launchthat-plugin-core";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import type { ColumnDefinition, FilterValue } from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { CopyText } from "@acme/ui/copy-text";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";

export interface UnifiedLogRow extends Record<string, unknown> {
  _id: string;
  createdAt?: number;
  pluginKey?: string;
  kind?: string;
  email?: string;
  level?: "debug" | "info" | "warn" | "error";
  status?: "scheduled" | "running" | "complete" | "failed";
  message?: string;
  actionUrl?: string;
  metadata?: unknown;
}

const levelBadgeVariant = (level: UnifiedLogRow["level"]) => {
  if (level === "error") return "destructive" as const;
  if (level === "warn") return "secondary" as const;
  return "outline" as const;
};

const statusBadgeVariant = (status: UnifiedLogRow["status"]) => {
  if (status === "failed") return "destructive" as const;
  if (status === "complete") return "default" as const;
  if (status === "running") return "secondary" as const;
  return "outline" as const;
};

const statusLabel = (row: UnifiedLogRow) => {
  if (row.kind === "email.queued") return "queued";
  if (row.kind === "email.sent") return "delivered";
  if (row.kind === "email.failed") return "failed";
  return row.status ?? "";
};

const notificationTypeLabel = (row: UnifiedLogRow) => {
  const meta =
    typeof row.metadata === "object" && row.metadata
      ? (row.metadata as Record<string, unknown>)
      : null;
  const notificationType =
    meta && typeof meta.notificationType === "string"
      ? meta.notificationType
      : typeof row.kind === "string" && row.kind.startsWith("notification.test")
        ? "test"
        : typeof row.kind === "string" &&
            row.kind.startsWith("notification.broadcast")
          ? "manual"
          : "automated";

  if (notificationType === "manual") return "Manual";
  if (notificationType === "test") return "Test";
  return "Automated";
};

export interface LogEntityListProps {
  orgId: Id<"organizations">;
  actorUserId: Id<"users">;
  listLogsQuery: unknown;
  listEmailSuggestionsQuery: unknown;
  title: string;
  description?: string;
  limit?: number;
  initialPluginKey?: string;
  hidePluginFilter?: boolean;
}

export const LogEntityList = (props: LogEntityListProps) => {
  const {
    orgId,
    actorUserId,
    listLogsQuery,
    listEmailSuggestionsQuery,
    title,
    description,
    limit = 500,
    initialPluginKey,
    hidePluginFilter,
  } = props;

  const [pluginKeyFilter, setPluginKeyFilter] = useState<string>(
    typeof initialPluginKey === "string" ? initialPluginKey : "",
  );
  const [emailFilter, setEmailFilter] = useState<string>("");

  const entityListInitialFilters = useMemo(() => {
    // Important: If we pass `{ pluginKey: "" }` it becomes an active client-side filter
    // and will filter out all rows (since no row has pluginKey === "").
    // Only set an initial filter when we have a non-empty plugin key.
    if (typeof initialPluginKey === "string" && initialPluginKey.trim()) {
      const out: Record<string, FilterValue> = {
        pluginKey: initialPluginKey.trim(),
      };
      return out;
    }
    const out: Record<string, FilterValue> = {};
    return out;
  }, [initialPluginKey]);

  const rows = useQuery(listLogsQuery as any, {
    orgId,
    actorUserId,
    limit,
    filter:
      pluginKeyFilter || emailFilter
        ? {
            pluginKey: pluginKeyFilter || undefined,
            email: emailFilter.trim().toLowerCase() || undefined,
          }
        : undefined,
  }) as UnifiedLogRow[] | null | undefined;

  const emailSuggestions = useQuery(listEmailSuggestionsQuery as any, {
    orgId,
    actorUserId,
    prefix: emailFilter,
    limit: 10,
  }) as string[] | null | undefined;

  const columns: ColumnDefinition<UnifiedLogRow>[] = useMemo(
    () => [
      {
        id: "createdAt",
        header: "Time",
        accessorKey: "createdAt",
        cell: (row: UnifiedLogRow) => (
          <div className="text-sm">
            {typeof row.createdAt === "number"
              ? new Date(row.createdAt).toLocaleString()
              : ""}
          </div>
        ),
      },
      {
        id: "pluginKey",
        header: "Source",
        accessorKey: "pluginKey",
        cell: (row: UnifiedLogRow) => {
          const v = row.pluginKey ?? "";
          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{v || "unknown"}</Badge>
              {v ? <CopyText value={v} /> : null}
            </div>
          );
        },
      },
      {
        id: "type",
        header: "Type",
        cell: (row: UnifiedLogRow) =>
          row.pluginKey === "notifications" ? (
            <Badge variant="outline" className="text-xs">
              {notificationTypeLabel(row)}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
      {
        id: "kind",
        header: "Kind",
        accessorKey: "kind",
        cell: (row: UnifiedLogRow) => {
          const v = row.kind ?? "";
          return (
            <div className="flex items-center gap-2">
              <code className="text-muted-foreground text-xs">{v}</code>
              {v ? <CopyText value={v} /> : null}
            </div>
          );
        },
      },
      {
        id: "message",
        header: "Message",
        accessorKey: "message",
        cell: (row: UnifiedLogRow) => (
          <div className="space-y-1">
            <div className="text-sm">{row.message ?? ""}</div>
            {row.actionUrl ? (
              <Link
                href={row.actionUrl}
                className="text-primary block max-w-[520px] truncate text-xs underline"
                target="_blank"
                rel="noreferrer"
              >
                {row.actionUrl}
              </Link>
            ) : null}
          </div>
        ),
      },
      {
        id: "email",
        header: "Email",
        accessorKey: "email",
        cell: (row: UnifiedLogRow) => {
          const v = typeof row.email === "string" ? row.email : "";
          return v ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">{v}</span>
              <CopyText value={v} />
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
      },
      {
        id: "level",
        header: "Level",
        accessorKey: "level",
        cell: (row: UnifiedLogRow) => (
          <Badge variant={levelBadgeVariant(row.level)}>
            {row.level ?? "info"}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (row: UnifiedLogRow) =>
          row.status ? (
            <Badge variant={statusBadgeVariant(row.status)}>
              {statusLabel(row)}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
    ],
    [],
  );

  const data = Array.isArray(rows) ? rows : [];

  const filters = hidePluginFilter
    ? undefined
    : ([
        {
          id: "pluginKey",
          label: "Source",
          type: "select" as const,
          field: "pluginKey",
          options: [
            { label: "All", value: "" },
            { label: "core.emails", value: "core.emails" },
            { label: "discord", value: "discord" },
            { label: "notifications", value: "notifications" },
            { label: "ecommerce", value: "ecommerce" },
            { label: "lms", value: "lms" },
            { label: "disclaimers", value: "disclaimers" },
          ],
        },
      ] satisfies {
        id: string;
        label: string;
        type: "select";
        field: keyof UnifiedLogRow;
        options: { label: string; value: string }[];
      }[]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground text-sm">
          Filter by recipient email (exact match).
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Filter by email…"
            list="admin-logs-email-suggestions"
            className="max-w-md"
          />
          <datalist id="admin-logs-email-suggestions">
            {(Array.isArray(emailSuggestions) ? emailSuggestions : []).map(
              (email) => (
                <option key={email} value={email} />
              ),
            )}
          </datalist>
        </div>
      </div>

      <EntityList<UnifiedLogRow>
        title={title}
        description={description}
        data={data}
        columns={columns}
        isLoading={rows === undefined}
        enableSearch
        enableFooter={false}
        filters={
          filters as unknown as
            | {
                id: string;
                label: string;
                type: "select";
                field: keyof UnifiedLogRow;
                options: { label: string; value: string }[];
              }[]
            | undefined
        }
        onFiltersChange={(filters: Record<string, FilterValue>) => {
          const val = filters.pluginKey;
          setPluginKeyFilter(typeof val === "string" ? val : "");
        }}
        initialFilters={entityListInitialFilters}
      />
    </div>
  );
};
