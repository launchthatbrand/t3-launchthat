"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { usePaginatedQuery, useQuery } from "convex/react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
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

// Type for the scenario log data (enriched with scenario name)
type ScenarioLogData = Doc<"scenarioLogs"> & {
  scenarioName?: string;
  nodeName?: string;
};

const statusConfig = {
  running: { icon: Clock, color: "blue", label: "Running" },
  success: { icon: CheckCircle, color: "green", label: "Success" },
  error: { icon: AlertCircle, color: "red", label: "Error" },
  skipped: { icon: Pause, color: "gray", label: "Skipped" },
  cancelled: { icon: X, color: "orange", label: "Cancelled" },
} as const;

function GlobalAutomationLogsPageBody() {
  const router = useRouter();

  // Fetch all scenario logs with pagination
  const logsResult = usePaginatedQuery(
    api.integrations.scenarioLogs.queries.getAllScenarioLogs,
    {},
    { initialNumItems: 50 },
  );

  // Fetch scenarios to enrich log data with scenario names
  const scenarios = useQuery(
    api.integrations.scenarios.queries.getAllScenarios,
  );

  // Fetch nodes for node names (if needed)
  const allNodes = useQuery(api.integrations.nodes.queries.getAllNodes);

  // Enrich logs with scenario and node names
  const enrichedLogs: ScenarioLogData[] = (logsResult.results ?? []).map(
    (log) => {
      const scenario = scenarios?.find((s) => s._id === log.scenarioId);
      const node = log.nodeId
        ? allNodes?.find((n) => n._id === log.nodeId)
        : undefined;

      return {
        ...log,
        scenarioName: scenario?.name ?? "Unknown Scenario",
        nodeName: node?.label ?? (log.nodeId ? "Unknown Node" : undefined),
      };
    },
  );

  const columns: ColumnDef<ScenarioLogData>[] = [
    {
      accessorKey: "_creationTime",
      header: "Timestamp",
      cell: ({ row }) => {
        const timestamp = row.getValue("_creationTime") as number;
        return (
          <div className="text-sm">{new Date(timestamp).toLocaleString()}</div>
        );
      },
      size: 150,
    },
    {
      accessorKey: "scenarioName",
      header: "Scenario",
      cell: ({ row }) => {
        const scenarioName = row.original.scenarioName;
        const scenarioId = row.original.scenarioId;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{scenarioName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/admin/integrations/scenarios/${scenarioId}`)
              }
              className="h-6 w-6 p-0"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        );
      },
      size: 200,
    },
    {
      accessorKey: "runId",
      header: "Run ID",
      cell: ({ row }) => {
        const runId = row.getValue("runId") as string;
        const shortRunId =
          runId.length > 20 ? `${runId.substring(0, 20)}...` : runId;
        return (
          <div
            className="font-mono text-xs text-muted-foreground"
            title={runId}
          >
            {shortRunId}
          </div>
        );
      },
      size: 150,
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        const nodeName = row.original.nodeName;
        return (
          <div>
            <div className="font-medium">{action}</div>
            {nodeName && (
              <div className="text-xs text-muted-foreground">
                Node: {nodeName}
              </div>
            )}
          </div>
        );
      },
      size: 180,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusConfig;
        const config = statusConfig[status];
        const Icon = config.icon;

        return (
          <Badge
            variant="outline"
            className={`text-${config.color}-600 border-${config.color}-200`}
          >
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
      size: 100,
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const duration = row.getValue("duration") as number | undefined;
        if (!duration) return <span className="text-muted-foreground">-</span>;

        if (duration < 1000) {
          return <span className="text-sm">{Math.round(duration)}ms</span>;
        } else {
          return (
            <span className="text-sm">{(duration / 1000).toFixed(2)}s</span>
          );
        }
      },
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const scenarioId = row.original.scenarioId;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/admin/integrations/scenarios/${scenarioId}/logs`)
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              View Scenario Logs
            </Button>
          </div>
        );
      },
      size: 180,
    },
  ];

  const filterConfig: FilterConfig<ScenarioLogData> = {
    searchFields: ["action", "scenarioName", "runId"],
    filters: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "All Statuses", value: "all" },
          { label: "Running", value: "running" },
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
          { label: "Skipped", value: "skipped" },
          { label: "Cancelled", value: "cancelled" },
        ],
      },
      {
        key: "action",
        label: "Action Type",
        type: "select",
        options: [
          { label: "All Actions", value: "all" },
          { label: "Scenario Start", value: "scenario_start" },
          { label: "Scenario Complete", value: "scenario_complete" },
          { label: "Send Webhook", value: "send_webhook" },
          { label: "Node Execute", value: "node_execute" },
        ],
      },
    ],
  };

  const handleRowClick = (log: ScenarioLogData) => {
    // Navigate to scenario-specific logs page
    router.push(`/admin/integrations/scenarios/${log.scenarioId}/logs`);
  };

  const isLoading = logsResult.isLoading || !scenarios || !allNodes;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Automation Logs</h1>
        <p className="text-muted-foreground">
          View execution logs from all automation scenarios
        </p>
      </div>

      <EntityList
        data={enrichedLogs}
        columns={columns}
        loading={isLoading}
        error={logsResult.error?.message}
        filterConfig={filterConfig}
        onRowClick={handleRowClick}
        viewModes={[]}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12">
            <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Automation Logs Found</h3>
            <p className="text-muted-foreground">
              Automation logs will appear here when scenarios are executed
            </p>
          </div>
        }
      />

      {/* Add infinite scroll load more button if there's more data */}
      {logsResult.status === "CanLoadMore" && (
        <div className="flex justify-center py-4">
          <Button
            onClick={() => logsResult.loadMore(5)}
            disabled={logsResult.isLoading}
            variant="outline"
          >
            {logsResult.isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function GlobalAutomationLogsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading automation logs…</div>}>
      <GlobalAutomationLogsPageBody />
    </Suspense>
  );
}
