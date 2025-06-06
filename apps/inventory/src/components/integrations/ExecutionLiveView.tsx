import type { Id } from "@/convex/_generated/dataModel";
/**
 * ExecutionLiveView component
 *
 * Real-time detailed view of a scenario execution in progress,
 * showing live updates of each node's status and execution time.
 */
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowUpDown,
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  StopCircle,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";

interface ExecutionLiveViewProps {
  executionId: Id<"scenario_executions">;
  onBack?: () => void;
  onStop?: () => void;
}

export function ExecutionLiveView({
  executionId,
  onBack,
  onStop,
}: ExecutionLiveViewProps) {
  // Auto-refresh interval (in milliseconds)
  const REFRESH_INTERVAL = 1000;
  const [refreshKey, setRefreshKey] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Set up auto-refresh for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
      setElapsedTime((prev) => prev + 1);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to execution updates
  const executionStatus = useQuery(
    api.integrations.scenarios.execution.subscribeToExecution,
    { executionId },
    { refreshKey },
  );

  // Get detailed execution information
  const executionDetails = useQuery(
    api.integrations.scenarios.execution.getExecutionDetails,
    { executionId },
  );

  if (!executionStatus || !executionDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Execution</CardTitle>
          <CardDescription>Loading execution details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine if execution is still running
  const isRunning = executionStatus.status === "running";

  // Format time duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000) % 60;
    const hours = Math.floor(ms / 3600000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get the duration based on execution status
  const getDuration = () => {
    if (executionStatus.endTime) {
      return formatDuration(
        executionStatus.endTime - executionStatus.startTime,
      );
    } else {
      return formatDuration(Date.now() - executionStatus.startTime);
    }
  };

  // Calculate overall progress
  const totalNodes = executionStatus.nodeStats.total;
  const completedNodes =
    executionStatus.nodeStats.completed +
    executionStatus.nodeStats.failed +
    executionStatus.nodeStats.skipped;
  const progress =
    totalNodes > 0
      ? Math.min(100, Math.round((completedNodes / totalNodes) * 100))
      : 0;

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700"
          >
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Running
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="border-green-200 bg-green-50 text-green-700"
          >
            <Check className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="border-red-200 bg-red-50 text-red-700"
          >
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "skipped":
        return (
          <Badge
            variant="outline"
            className="border-yellow-200 bg-yellow-50 text-yellow-700"
          >
            <ArrowUpDown className="mr-1 h-3 w-3" />
            Skipped
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-gray-200 bg-gray-50 text-gray-700"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-200 bg-gray-50 text-gray-700"
          >
            {status}
          </Badge>
        );
    }
  };

  // Sort node results by position/execution order
  const nodeResults = [...executionDetails.nodeResults];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={onBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <CardTitle>Live Execution</CardTitle>
            <CardDescription>
              {executionDetails.scenario?.name || "Scenario"} execution in
              progress
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(executionStatus.status)}
          {isRunning && onStop && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center text-red-600"
              onClick={onStop}
            >
              <StopCircle className="mr-1 h-4 w-4" />
              Stop
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <h4 className="mb-1 text-sm font-semibold text-gray-500">
                Started
              </h4>
              <p className="text-sm">
                {format(executionStatus.startTime, "MMM d, yyyy HH:mm:ss")}
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold text-gray-500">
                Duration
              </h4>
              <p className="text-sm">{getDuration()}</p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold text-gray-500">
                Status
              </h4>
              <div className="flex space-x-2">
                <Badge
                  variant="outline"
                  className="border-green-200 bg-green-50 text-xs"
                >
                  <Check className="mr-1 h-3 w-3" />
                  {executionStatus.nodeStats.completed}
                </Badge>
                {executionStatus.nodeStats.running > 0 && (
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-xs"
                  >
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    {executionStatus.nodeStats.running}
                  </Badge>
                )}
                {executionStatus.nodeStats.pending > 0 && (
                  <Badge
                    variant="outline"
                    className="border-gray-200 bg-gray-50 text-xs"
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {executionStatus.nodeStats.pending}
                  </Badge>
                )}
                {executionStatus.nodeStats.failed > 0 && (
                  <Badge
                    variant="outline"
                    className="border-red-200 bg-red-50 text-xs"
                  >
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {executionStatus.nodeStats.failed}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold text-gray-500">
                Progress
              </h4>
              <p className="text-sm">
                {progress}% ({completedNodes}/{totalNodes} nodes)
              </p>
            </div>
          </div>

          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Execution Progress
              </span>
              <span className="text-xs font-medium text-gray-500">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold">Node Execution Status</h3>
          <div className="space-y-3">
            {nodeResults.map((node) => (
              <div
                key={node.nodeId.toString()}
                className="rounded-md border border-gray-100 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      Node {node.nodeId.slice(-4)}
                    </span>
                    {getStatusBadge(node.status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {node.endTime
                      ? formatDuration(node.endTime - node.startTime)
                      : node.status === "running"
                        ? formatDuration(Date.now() - node.startTime)
                        : ""}
                  </div>
                </div>
                {node.error && (
                  <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                    <div className="font-semibold">Error:</div>
                    <div className="mt-1 font-mono">
                      {typeof node.error === "string"
                        ? node.error
                        : node.error.message || "Unknown error"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
