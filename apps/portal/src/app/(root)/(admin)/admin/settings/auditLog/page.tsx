"use client";

// import {
//   auditLogFilters,
//   AuditLogTable,
//   createAuditLogColumns,
// } from "launchthat-plugin-commerce";
// import type { AuditLog } from "launchthat-plugin-commerce";
import React from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

// Import shared utilities from AuditLogViewer

export default function AuditLogPage() {
  // Get audit log statistics
  const auditLogStats = useQuery(
    api.core.auditLog.queries.getAuditLogStats,
    {},
  );

  // Show loading state
  if (auditLogStats === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="text-muted-foreground mt-2 text-sm">
              Loading audit log data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogStats.totalEntries}
            </div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {auditLogStats.successRate.toFixed(1)}%
            </div>
            <p className="text-muted-foreground text-xs">
              Successful operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogStats.uniqueUsers}
            </div>
            <p className="text-muted-foreground text-xs">
              Active users tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Issues
            </CardTitle>
            <AlertTriangle className="text-destructive h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-destructive text-2xl font-bold">
              {auditLogStats.entriesBySeverity.critical}
            </div>
            <p className="text-muted-foreground text-xs">Require attention</p>
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

        {/* Use the shared AuditLogTable component configured for system-wide view */}
        <AuditLogTable
          apiQuery="getAuditLogEntries"
          queryArgs={{}}
          showSummaryCards={false} // We already show custom stats above
          showResourceDetails={false} // System view doesn't need resource details
          exportButtonText="Export System Audit Log"
        />
      </div>
    </div>
  );
}
