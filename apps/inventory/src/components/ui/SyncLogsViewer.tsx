"use client";

import {
  CalendarIcon,
  ChevronRightIcon,
  DownloadIcon,
  FilterIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@acme/ui/pagination";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import type { ColumnDefinition } from "../shared/EntityList/EntityList";
import { EntityList } from "../shared/EntityList/EntityList";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "@/convex/_generated/api";

// Define interfaces for the component
interface RecordChange {
  recordId: string;
  changeType: "create" | "update" | "delete";
  success: boolean;
  details?: string;
}

interface SyncPhase {
  name: string;
  startTime: number;
  duration?: number;
  status: string;
}

interface PerformanceMetric {
  name: string;
  value: number | string;
  context?: string;
}

interface SyncLog {
  _id: Id<"mondaySyncLogs">;
  _creationTime: number;
  integrationId: Id<"mondayIntegration">;
  boardMappingId: Id<"mondayBoardMappings">;
  operation: string;
  status: string;
  startTimestamp: number;
  endTimestamp?: number;
  timeTaken?: number;
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsFailed?: number;
  error?: string;
  errorDetails?: string;
  recordChanges?: RecordChange[];
  syncPhases?: SyncPhase[];
  performanceMetrics?: PerformanceMetric[];
}

type SyncLogDetails = SyncLog;

/**
 * Helper function to render status badges with appropriate colors
 */
function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "destructive" | "outline" | "secondary" = "default";

  switch (status.toLowerCase()) {
    case "completed":
    case "success":
      variant = "default";
      break;
    case "completed_with_errors":
    case "warning":
      variant = "secondary";
      break;
    case "failed":
    case "error":
      variant = "destructive";
      break;
    case "pending":
    case "in_progress":
      variant = "outline";
      break;
    default:
      variant = "outline";
  }

  return <Badge variant={variant}>{status}</Badge>;
}

const columns: ColumnDef<SyncLog>[] = [
  {
    accessorKey: "operation",
    header: "Operation",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("operation")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "startTimestamp",
    header: "Started",
    cell: ({ row }) => {
      const timestamp = row.getValue("startTimestamp") as number;
      return (
        <span title={format(timestamp, "PPpp")}>
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
      );
    },
  },
  {
    accessorKey: "timeTaken",
    header: "Duration",
    cell: ({ row }) => {
      const timeTaken = row.getValue("timeTaken") as number;
      if (!timeTaken) return "N/A";
      return timeTaken < 1000
        ? `${timeTaken}ms`
        : `${(timeTaken / 1000).toFixed(1)}s`;
    },
  },
  {
    accessorKey: "recordsProcessed",
    header: "Processed",
    cell: ({ row }) => {
      const value = row.getValue("recordsProcessed");
      return value ?? "N/A";
    },
  },
  {
    accessorKey: "successRate",
    header: "Success Rate",
    cell: ({ row }) => {
      const value = row.getValue("successRate") as number | undefined;
      return value !== undefined ? `${value.toFixed(1)}%` : "N/A";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => {
            // Handle view details action
          }}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      );
    },
  },
];

/**
 * Helper function for exporting data to JSON
 */
const exportToJson = (data: Record<string, unknown>, filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Helper function for exporting data to CSV
 */
const exportToCsv = (data: Record<string, unknown>[], filename: string) => {
  // Check if data exists
  if (!data.length) return;

  // We know firstItem exists because we checked data.length
  const firstItem = data[0] as Record<string, unknown>;
  const headers = Object.keys(firstItem).filter(
    (key) => !key.startsWith("_") || key === "_creationTime" || key === "_id",
  );

  // Convert data to CSV format
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      // Format dates
      if (header.includes("Timestamp") || header === "_creationTime") {
        return val ? `"${format(val as number, "yyyy-MM-dd HH:mm:ss")}"` : "";
      }
      // Format nested objects and arrays
      if (typeof val === "object" && val !== null) {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      // Format strings with quotes and escape quotes
      if (typeof val === "string") {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val ?? "";
    });
    csvRows.push(values.join(","));
  }

  // Create and download the CSV file
  const csvStr = csvRows.join("\n");
  const blob = new Blob([csvStr], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function SyncLogsViewer() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLogId, setSelectedLogId] =
    useState<Id<"mondaySyncLogs"> | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const pageSize = 10;

  // Add mutation for retrying operations
  const pullFromMondayMutation = useMutation(
    api.monday.mutations.pullFromMonday,
  );
  const pushToMondayMutation = useMutation(api.monday.mutations.pushToMonday);

  // Get sync logs with pagination
  const paginatedLogs = useQuery(api.monday.queries.getSyncLogs, {
    status: activeTab === "all" ? undefined : activeTab,
    paginationOpts: {
      numItems: pageSize,
      cursor: currentPage === 0 ? null : `${currentPage * pageSize}`,
    },
  });

  // Get summary stats
  const summaryStats = useQuery(api.monday.queries.getSyncLogsSummary);

  // Get log details when a log is selected
  const logDetails = useQuery(
    api.monday.queries.getSyncLogDetails,
    selectedLogId ? { logId: selectedLogId } : "skip",
  );

  const handleCloseDetails = () => {
    setSelectedLogId(null);
  };

  // Function to handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle retry of failed operations
  const handleRetryOperation = async (logDetails: SyncLogDetails) => {
    setIsRetrying(true);
    try {
      const boardMappingId = logDetails.boardMappingId;
      const integrationId = logDetails.integrationId;

      if (!boardMappingId || !integrationId) {
        alert("Cannot retry: Missing required information");
        return;
      }

      // Determine which operation to retry based on the original operation
      if (logDetails.operation?.toLowerCase()?.includes("pull")) {
        await pullFromMondayMutation({
          integrationId,
          boardMappingId,
        });
      } else if (logDetails.operation?.toLowerCase()?.includes("push")) {
        await pushToMondayMutation({
          integrationId,
          boardMappingId,
        });
      } else {
        alert("Cannot determine operation type to retry");
        return;
      }

      // Refresh the log details after retry
      setSelectedLogId(null);

      // Small delay before showing success message
      setTimeout(() => {
        alert("Sync operation retried successfully");
      }, 500);
    } catch (error) {
      console.error("Error retrying operation:", error);
      alert(
        `Error retrying operation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsRetrying(false);
    }
  };

  // Function to export log details
  const handleExportLogDetails = () => {
    if (!logDetails) return;

    const filename = `sync-log-${logDetails._id}-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`;
    exportToJson(logDetails, filename);
  };

  // Function to export all logs
  const handleExportAllLogs = () => {
    if (!paginatedLogs?.page) return;

    const filename = `sync-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
    exportToCsv(paginatedLogs.page, filename);
  };

  // Generate summary cards
  const summaryCards = [
    {
      title: "Total Operations",
      value: summaryStats?.totalOperations ?? 0,
      description: "Total sync operations",
    },
    {
      title: "Success Rate",
      value: summaryStats?.successRate
        ? `${(summaryStats.successRate * 100).toFixed(1)}%`
        : "N/A",
      description: "Percentage of successful operations",
    },
    {
      title: "Failed Operations",
      value: summaryStats?.failedOperations ?? 0,
      description: "Operations with errors",
    },
    {
      title: "Records Processed",
      value: summaryStats?.totalRecordsProcessed ?? 0,
      description: "Total records synchronized",
    },
  ];

  // Define columns for the EntityList
  const entityColumns: ColumnDefinition<SyncLog>[] = [
    {
      id: "operation",
      header: "Operation",
      accessorKey: "operation",
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (log) => <StatusBadge status={log.status} />,
    },
    {
      id: "startTimestamp",
      header: "Started",
      accessorKey: "startTimestamp",
      cell: (log) => (
        <span title={format(log.startTimestamp, "PPpp")}>
          {formatDistanceToNow(log.startTimestamp, { addSuffix: true })}
        </span>
      ),
    },
    {
      id: "duration",
      header: "Duration",
      accessorKey: "timeTaken",
      cell: (log) => {
        if (!log.timeTaken) return "N/A";
        return log.timeTaken < 1000
          ? `${log.timeTaken}ms`
          : `${(log.timeTaken / 1000).toFixed(1)}s`;
      },
    },
    {
      id: "records",
      header: "Records",
      cell: (log) => (
        <span>
          {log.recordsProcessed ?? 0} processed
          {log.recordsFailed ? `, ${log.recordsFailed} failed` : ""}
        </span>
      ),
    },
  ];

  // Define filters for the EntityList
  const entityFilters = [
    {
      id: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { label: "All", value: "all" },
        { label: "Completed", value: "completed" },
        { label: "Failed", value: "failed" },
        { label: "In Progress", value: "in_progress" },
        { label: "With Errors", value: "completed_with_errors" },
      ],
      field: "status" as keyof SyncLog,
    },
  ];

  // Define entity actions
  const entityActions = [
    {
      id: "view-details",
      label: "View Details",
      onClick: (log: SyncLog) => setSelectedLogId(log._id),
      variant: "outline" as const,
    },
  ];

  // Create pagination configuration
  const paginationConfig = paginatedLogs?.page
    ? {
        pageIndex: currentPage,
        pageSize,
        pageCount: Math.ceil((paginatedLogs.totalCount ?? 0) / pageSize),
        onPageChange: handlePageChange,
      }
    : undefined;

  // Custom action buttons for the EntityList
  const actionButtons = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportAllLogs}
      disabled={!paginatedLogs?.page?.length}
    >
      <DownloadIcon className="mr-2 h-4 w-4" />
      Export Logs
    </Button>
  );

  // Custom empty state
  const emptyState = (
    <div className="py-10 text-center">
      <h3 className="mb-2 text-lg font-medium">No sync logs found</h3>
      <p className="text-muted-foreground">
        No synchronization operations have been logged yet.
      </p>
    </div>
  );

  // Render the summary cards
  const renderSummaryCards = () => (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card, i) => (
        <div
          key={i}
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
        >
          <div className="flex flex-col space-y-1.5 pb-3">
            <h3 className="text-sm font-medium">{card.title}</h3>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </div>
          <div className="text-2xl font-bold">
            {summaryStats ? card.value : <Skeleton className="h-8 w-20" />}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {renderSummaryCards()}

      <EntityList
        title="Synchronization Logs"
        description="View and manage Monday.com synchronization operations"
        data={paginatedLogs?.page ?? []}
        columns={entityColumns}
        filters={entityFilters}
        isLoading={!paginatedLogs}
        entityActions={entityActions}
        onRowClick={(log) => setSelectedLogId(log._id)}
        onFiltersChange={(filters) => {
          const statusFilter = filters.status as string | undefined;
          setActiveTab(statusFilter ?? "all");
          setCurrentPage(0);
        }}
        pagination={paginationConfig}
        actions={actionButtons}
        emptyState={emptyState}
        defaultViewMode="list"
      />

      {/* Details dialog */}
      {selectedLogId && (
        <Dialog open={!!selectedLogId} onOpenChange={handleCloseDetails}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Sync Log Details</DialogTitle>
                  <DialogDescription>
                    Detailed information about the synchronization operation.
                  </DialogDescription>
                </div>
                {logDetails && (
                  <div className="flex gap-2">
                    {(logDetails.status === "failed" ||
                      logDetails.status === "completed_with_errors") && (
                      <Button
                        onClick={() => handleRetryOperation(logDetails)}
                        disabled={isRetrying}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCwIcon className="mr-2 h-4 w-4" />
                        {isRetrying ? "Retrying..." : "Retry Operation"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportLogDetails}
                    >
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Export Details
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>

            {logDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/20 p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Operation
                    </h3>
                    <p className="text-base font-medium">
                      {logDetails.operation}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Status
                    </h3>
                    <StatusBadge status={logDetails.status} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Started
                    </h3>
                    <p className="text-base">
                      {format(logDetails.startTimestamp, "PPpp")}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Duration
                    </h3>
                    <p className="text-base">
                      {logDetails.timeTaken
                        ? logDetails.timeTaken < 1000
                          ? `${logDetails.timeTaken}ms`
                          : `${(logDetails.timeTaken / 1000).toFixed(1)}s`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Records Processed
                    </h3>
                    <p className="text-base">
                      {logDetails.recordsProcessed ?? 0}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Records Created
                    </h3>
                    <p className="text-base">
                      {logDetails.recordsCreated ?? 0}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Records Updated
                    </h3>
                    <p className="text-base">
                      {logDetails.recordsUpdated ?? 0}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Records Failed
                    </h3>
                    <p className="text-base">{logDetails.recordsFailed ?? 0}</p>
                  </div>
                </div>

                {/* Records changes section */}
                {logDetails.recordChanges &&
                  logDetails.recordChanges.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-base font-medium">
                        Affected Records
                      </h3>
                      <div className="overflow-hidden rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Record ID</TableHead>
                              <TableHead>Change Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logDetails.recordChanges.map(
                              (change: RecordChange, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono text-xs">
                                    {change.recordId || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        change.changeType === "create"
                                          ? "secondary"
                                          : change.changeType === "update"
                                            ? "default"
                                            : "destructive"
                                      }
                                    >
                                      {change.changeType}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        change.success
                                          ? "default"
                                          : "destructive"
                                      }
                                    >
                                      {change.success ? "Success" : "Failed"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[300px] truncate">
                                    {change.details ?? "No details provided"}
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                {/* Sync phases section */}
                {logDetails.syncPhases && logDetails.syncPhases.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-medium">Sync Phases</h3>
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Phase</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logDetails.syncPhases.map(
                            (phase: SyncPhase, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {phase.name}
                                </TableCell>
                                <TableCell>
                                  {format(phase.startTime, "HH:mm:ss")}
                                </TableCell>
                                <TableCell>
                                  {phase.duration
                                    ? phase.duration < 1000
                                      ? `${phase.duration}ms`
                                      : `${(phase.duration / 1000).toFixed(1)}s`
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge
                                    status={phase.status || "unknown"}
                                  />
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Error details section */}
                {(logDetails.error || logDetails.errorDetails) && (
                  <div className="space-y-3">
                    <h3 className="text-base font-medium text-destructive">
                      Error Information
                    </h3>
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                      {logDetails.error && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Error Message
                          </h4>
                          <p className="text-destructive">{logDetails.error}</p>
                        </div>
                      )}
                      {logDetails.errorDetails && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Error Details
                          </h4>
                          <pre className="mt-1 max-h-[200px] overflow-auto rounded border bg-card p-2 text-xs">
                            {logDetails.errorDetails}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Performance metrics section */}
                {logDetails.performanceMetrics &&
                  logDetails.performanceMetrics.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-base font-medium">
                        Performance Metrics
                      </h3>
                      <div className="overflow-hidden rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Metric</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Context</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {logDetails.performanceMetrics.map(
                              (metric: PerformanceMetric, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {metric.name}
                                  </TableCell>
                                  <TableCell>
                                    {typeof metric.value === "number" &&
                                    metric.name.toLowerCase().includes("time")
                                      ? metric.value < 1000
                                        ? `${metric.value}ms`
                                        : `${(metric.value / 1000).toFixed(1)}s`
                                      : metric.value}
                                  </TableCell>
                                  <TableCell className="max-w-[300px] truncate">
                                    {metric.context ?? ""}
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
