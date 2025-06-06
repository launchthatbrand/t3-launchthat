import type { Id } from "@/convex/_generated/dataModel";
/**
 * ExecutionMonitor component
 *
 * Real-time monitoring UI for active scenario executions.
 * Shows progress, status, and stats for running scenarios.
 */
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatDistance } from "date-fns";
import {
  AlertCircle,
  ArrowUpDown,
  Check,
  Clock,
  Loader2,
  PlayCircle,
  RefreshCcw,
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
import { Skeleton } from "@acme/ui/skeleton";

interface ExecutionMonitorProps {
  limit?: number;
  onViewDetails?: (executionId: Id<"scenario_executions">) => void;
  autoRefresh?: boolean;
}

export function ExecutionMonitor({
  limit = 5,
  onViewDetails,
  autoRefresh = true,
}: ExecutionMonitorProps) {
  // Auto-refresh interval (in milliseconds)
  const REFRESH_INTERVAL = 2000;
  const [refreshKey, setRefreshKey] = useState(0);

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Query active executions
  const activeExecutions = useQuery(
    api.integrations.scenarios.execution.getActiveExecutions,
    { limit },
    { refreshKey },
  );

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Format elapsed time
  const formatElapsedTime = (startTime: number) => {
    const elapsed = Date.now() - startTime;

    // Less than a minute
    if (elapsed < 60000) {
      return `${Math.floor(elapsed / 1000)}s`;
    }

    // Less than an hour
    if (elapsed < 3600000) {
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }

    // More than an hour
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Active Executions</CardTitle>
          <CardDescription>
            Scenarios currently running in real-time
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          className="flex items-center gap-1"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {activeExecutions === undefined ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : activeExecutions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
            <PlayCircle className="mb-2 h-10 w-10 text-gray-400" />
            <p className="mb-1 text-sm">No active executions</p>
            <p className="text-xs">All scenarios are currently idle</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeExecutions.map((execution) => (
              <div
                key={execution._id.toString()}
                className="cursor-pointer rounded-lg border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm"
                onClick={() => onViewDetails?.(execution._id)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{execution.scenario.name}</h3>
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-700"
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      Running
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatElapsedTime(execution.startTime)}
                  </div>
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <Progress value={execution.progress} className="h-2" />
                  <span className="text-xs font-medium text-gray-500">
                    {execution.progress}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500" />
                      <span>{execution.nodeStats.completed} completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 text-blue-500" />
                      <span>{execution.nodeStats.running} running</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3 text-yellow-500" />
                      <span>{execution.nodeStats.pending} pending</span>
                    </div>
                    {execution.nodeStats.failed > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span>{execution.nodeStats.failed} failed</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium">
                    {execution.nodeStats.completed}/{execution.nodeStats.total}{" "}
                    nodes
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
