"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { useParams, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { usePaginatedQuery } from "convex/react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  Pause,
  X,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import type {
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";

// Type for the automation log data
type AutomationLogData = Doc<"automationLogs"> & {
  formattedDuration: string;
  formattedTimestamp: string;
  statusIcon: JSX.Element;
  actionDisplay: string;
};

export default function ScenarioLogsPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params?.id as Id<"scenarios">;

  // Get automation logs for this scenario
  const {
    results: logs,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.integrations.automationLogs.queries.getAutomationLogsByScenario,
    { scenarioId },
    { initialNumItems: 20 },
  );

  // Transform the data for display
  const transformedLogs: AutomationLogData[] = (logs ?? []).map((log) => {
    const duration = log.duration
      ? `${log.duration}ms`
      : log.endTime
        ? `${log.endTime - log.startTime}ms`
        : "-";

    const formattedTimestamp = new Date(log.timestamp).toLocaleString();

    // Get status icon
    let statusIcon: JSX.Element;
    switch (log.status) {
      case "success":
        statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
        break;
      case "error":
        statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />;
        break;
      case "running":
        statusIcon = <Clock className="h-4 w-4 text-blue-500" />;
        break;
      case "skipped":
        statusIcon = <Pause className="h-4 w-4 text-yellow-500" />;
        break;
      case "cancelled":
        statusIcon = <X className="h-4 w-4 text-gray-500" />;
        break;
      default:
        statusIcon = <Activity className="h-4 w-4 text-gray-500" />;
    }

    // Format action display
    const actionDisplay = log.action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return {
      ...log,
      formattedDuration: duration,
      formattedTimestamp,
      statusIcon,
      actionDisplay,
    };
  });

  // Define columns for the EntityList
  const columns: ColumnDef<AutomationLogData>[] = [
    {
      accessorKey: "timestamp",
      header: "Time",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.formattedTimestamp}</div>
      ),
    },
    {
      accessorKey: "runId",
      header: "Run ID",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.runId.slice(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.actionDisplay}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.statusIcon}
          <Badge
            variant={
              row.original.status === "success"
                ? "default"
                : row.original.status === "error"
                  ? "destructive"
                  : row.original.status === "running"
                    ? "secondary"
                    : "outline"
            }
          >
            {row.original.status}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.formattedDuration}
        </div>
      ),
    },
    {
      accessorKey: "nodeId",
      header: "Node",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.nodeId ? (
            <span className="font-mono">
              {row.original.nodeId.slice(0, 8)}...
            </span>
          ) : (
            <span className="text-muted-foreground">Scenario</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(
                `/admin/integrations/scenarios/${scenarioId}/logs/${row.original._id}`,
              )
            }
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>
      ),
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<AutomationLogData>[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "status",
      options: [
        { label: "Success", value: "success" },
        { label: "Error", value: "error" },
        { label: "Running", value: "running" },
        { label: "Skipped", value: "skipped" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      id: "action",
      label: "Action",
      type: "text",
      field: "action",
    },
    {
      id: "runId",
      label: "Run ID",
      type: "text",
      field: "runId",
    },
  ];

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() =>
          router.push(`/admin/integrations/scenarios/${scenarioId}`)
        }
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Scenario
      </Button>
      <Button
        variant="outline"
        onClick={() => router.push("/admin/integrations/logs")}
      >
        View All Logs
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <EntityList<AutomationLogData>
        data={transformedLogs}
        columns={columns}
        filters={filters}
        isLoading={status === "LoadingFirstPage"}
        title="Automation Logs"
        description="View execution logs for this automation scenario"
        defaultViewMode="list"
        viewModes={[]}
        actions={headerActions}
        onLoadMore={status === "CanLoadMore" ? loadMore : undefined}
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Logs Found</h3>
            <p className="text-muted-foreground">
              No execution logs for this scenario yet
            </p>
          </div>
        }
      />
    </div>
  );
}
