"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Database,
  Eye,
  Info,
  Shield,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type {
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import React, { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// Type for audit log entries based on our schema
type AuditLogEntry = {
  _id: string;
  _creationTime: number;
  userId?: string;
  sessionId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  uri: string;
  method?: string;
  userAgent?: string;
  referer?: string;
  ipAddress?: string;
  country?: string;
  region?: string;
  city?: string;
  severity: "info" | "warning" | "error" | "critical";
  category:
    | "authentication"
    | "authorization"
    | "data_access"
    | "data_modification"
    | "system"
    | "ecommerce"
    | "navigation"
    | "security";
  details?: string;
  oldValues?: string;
  newValues?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: number;
  processingTime?: number;
};

export default function AuditLogPage() {
  const router = useRouter();

  // Get paginated audit log data
  const {
    results: auditLogData,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.core.auditLog.getAuditLogEntries,
    {},
    { initialNumItems: 50 },
  );

  // Get audit log statistics
  const auditLogStats = useQuery(api.core.auditLog.getAuditLogStats, {});

  // Format date/time
  const formatDateTime = (timestamp: number) => {
    return format(new Date(timestamp), "MMM dd, yyyy 'at' h:mm a");
  };

  // Get severity badge
  const getSeverityBadge = (severity: AuditLogEntry["severity"]) => {
    const config = {
      info: { variant: "default" as const, icon: Info, label: "Info" },
      warning: {
        variant: "secondary" as const,
        icon: AlertTriangle,
        label: "Warning",
      },
      error: { variant: "destructive" as const, icon: XCircle, label: "Error" },
      critical: {
        variant: "destructive" as const,
        icon: AlertCircle,
        label: "Critical",
      },
    };

    const { variant, icon: Icon, label } = config[severity];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Get category badge
  const getCategoryBadge = (category: AuditLogEntry["category"]) => {
    const config = {
      authentication: { variant: "default" as const, label: "Auth" },
      authorization: { variant: "secondary" as const, label: "AuthZ" },
      data_access: { variant: "outline" as const, label: "Data Access" },
      data_modification: { variant: "secondary" as const, label: "Data Mod" },
      system: { variant: "default" as const, label: "System" },
      ecommerce: { variant: "default" as const, label: "E-commerce" },
      navigation: { variant: "outline" as const, label: "Navigation" },
      security: { variant: "destructive" as const, label: "Security" },
    };

    return (
      <Badge variant={config[category].variant}>{config[category].label}</Badge>
    );
  };

  // Get success badge
  const getSuccessBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Success
      </Badge>
    ) : (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  };

  // Column definitions for audit log
  const auditLogColumns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: "_id",
      header: "ID",
      cell: ({ row }) => (
        <div className="cursor-pointer font-mono text-sm hover:text-primary">
          {row.getValue("_id")?.toString().slice(-8)}
        </div>
      ),
    },
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDateTime(row.getValue("timestamp"))}
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("action")}</div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => getCategoryBadge(row.getValue("category")),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => getSeverityBadge(row.getValue("severity")),
    },
    {
      accessorKey: "success",
      header: "Status",
      cell: ({ row }) => getSuccessBadge(row.getValue("success")),
    },
    {
      accessorKey: "uri",
      header: "URI",
      cell: ({ row }) => (
        <div className="max-w-xs truncate font-mono text-sm">
          {row.getValue("uri")}
        </div>
      ),
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => {
        const ip = row.getValue("ipAddress");
        return ip ? (
          <div className="font-mono text-sm">{ip.toString()}</div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "userId",
      header: "User",
      cell: ({ row }) => {
        const userId = row.getValue("userId");
        return userId ? (
          <div className="font-mono text-sm">{userId.toString().slice(-8)}</div>
        ) : (
          <span className="text-muted-foreground">Anonymous</span>
        );
      },
    },
  ];

  // Filter configurations
  const auditLogFilters: FilterConfig<AuditLogEntry>[] = [
    {
      id: "category",
      label: "Category",
      type: "select",
      field: "category",
      options: [
        { label: "Authentication", value: "authentication" },
        { label: "Authorization", value: "authorization" },
        { label: "Data Access", value: "data_access" },
        { label: "Data Modification", value: "data_modification" },
        { label: "System", value: "system" },
        { label: "E-commerce", value: "ecommerce" },
        { label: "Navigation", value: "navigation" },
        { label: "Security", value: "security" },
      ],
    },
    {
      id: "severity",
      label: "Severity",
      type: "select",
      field: "severity",
      options: [
        { label: "Info", value: "info" },
        { label: "Warning", value: "warning" },
        { label: "Error", value: "error" },
        { label: "Critical", value: "critical" },
      ],
    },
    {
      id: "success",
      label: "Status",
      type: "select",
      field: "success",
      options: [
        { label: "Success", value: true },
        { label: "Failed", value: false },
      ],
    },
  ];

  // Entity actions
  const auditLogActions: EntityAction<AuditLogEntry>[] = [
    {
      id: "view",
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (entry) => {
        router.push(`/admin/settings/auditLog/${entry._id}`);
      },
      variant: "outline",
    },
  ];

  // Handle row click
  const handleRowClick = (entry: AuditLogEntry) => {
    router.push(`/admin/settings/auditLog/${entry._id}`);
  };

  // Show loading state
  if (auditLogData === undefined || auditLogStats === undefined) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading audit log data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/settings">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Audit Log</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Monitor system activity and user actions across the portal
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogStats.totalEntries}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {auditLogStats.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successful operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogStats.uniqueUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Active users tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Issues
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {auditLogStats.entriesBySeverity.critical}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Activity by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Object.entries(auditLogStats.entriesByCategory).map(
              ([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm capitalize">
                    {category.replace("_", " ")}
                  </span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Audit Log Entries</h2>

        <EntityList<AuditLogEntry>
          data={auditLogData || []}
          columns={auditLogColumns}
          filters={auditLogFilters}
          isLoading={
            auditLogData === undefined ||
            paginationStatus === "LoadingFirstPage"
          }
          title="Audit Log Entries"
          description="View and monitor all system activity and user actions"
          defaultViewMode="list"
          viewModes={["list"]}
          entityActions={auditLogActions}
          enableSearch={true}
          onRowClick={handleRowClick}
          emptyState={
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
              <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No Audit Log Entries</h3>
              <p className="text-muted-foreground">
                No activity has been logged yet
              </p>
            </div>
          }
          initialSort={{
            id: "timestamp",
            direction: "desc",
          }}
        />

        {/* Load More Button */}
        {paginationStatus === "CanLoadMore" && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => loadMore(25)}
              disabled={paginationStatus === "LoadingMore"}
            >
              {paginationStatus === "LoadingMore" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
