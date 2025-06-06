import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatDistance } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";

interface ExecutionMonitorProps {
  executionId: string;
  onComplete?: () => void;
}

/**
 * Real-time Execution Monitor
 *
 * Shows progress and details of a running scenario execution
 */
export default function ExecutionMonitor({
  executionId,
  onComplete,
}: ExecutionMonitorProps) {
  const [pollingEnabled, setPollingEnabled] = useState(true);

  // Get execution status (using real-time subscription)
  const executionStatus = useQuery(
    api.integrations.scenarios.monitoring.subscribeToExecution,
    { executionId },
  );

  // Get detailed execution data
  const executionDetails = useQuery(
    api.integrations.scenarios.monitoring.getExecutionStatus,
    { executionId },
  );

  // Handle completion
  useEffect(() => {
    if (executionStatus?.isComplete && pollingEnabled) {
      setPollingEnabled(false);
      if (onComplete) {
        onComplete();
      }
    }
  }, [executionStatus?.isComplete, onComplete, pollingEnabled]);

  if (!executionStatus || !executionDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Monitor</CardTitle>
          <CardDescription>Loading execution details...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If execution not found or user doesn't have access
  if (executionStatus.status === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Not Found</CardTitle>
          <CardDescription>
            The execution may have been deleted or you don't have access to it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-32 items-center justify-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Status icon based on execution status
  const statusIcon =
    executionStatus.status === "running" ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : executionStatus.status === "completed" ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );

  // Progress value
  const progress = executionStatus.progress ?? 0;

  // Calculate elapsed time
  const elapsedTime = executionDetails.startTime
    ? formatDistance(new Date(executionDetails.startTime), new Date(), {
        addSuffix: false,
      })
    : "unknown";

  // Calculate estimated remaining time
  const remainingTime = executionStatus.estimatedTimeRemaining
    ? formatDuration(executionStatus.estimatedTimeRemaining)
    : "Calculating...";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Execution Progress</CardTitle>
            <CardDescription>
              {executionStatus.status === "running"
                ? "Executing scenario..."
                : "Execution completed"}
            </CardDescription>
          </div>
          <Badge
            className={
              executionStatus.status === "running"
                ? "bg-blue-500"
                : executionStatus.status === "completed"
                  ? "bg-green-500"
                  : "bg-red-500"
            }
          >
            <div className="flex items-center gap-1">
              {statusIcon}
              <span>{capitalizeFirst(executionStatus.status)}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{Math.round(progress)}% Complete</span>
            {executionStatus.status === "running" && (
              <span className="text-muted-foreground">
                {remainingTime} remaining
              </span>
            )}
          </div>
          <Progress value={progress} />
        </div>

        {/* Execution details */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Started</p>
            <p className="text-sm font-medium">
              {executionDetails.startTime
                ? new Date(executionDetails.startTime).toLocaleString()
                : "Unknown"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="text-sm font-medium">{elapsedTime}</p>
          </div>

          {executionDetails.endTime && (
            <>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-sm font-medium">
                  {new Date(executionDetails.endTime).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-sm font-medium">
                  {formatDuration(
                    executionDetails.endTime - executionDetails.startTime,
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Current node details */}
        {executionDetails.currentNodeDetails && (
          <div className="mt-4 rounded-md border p-3">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium">Current Node</span>
              <Badge variant="outline">
                {executionDetails.currentNodeDetails.type}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {executionDetails.currentNodeDetails.status}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Position: {executionDetails.currentNodeDetails.position} |
              Operation: {executionDetails.currentNodeDetails.operation}
            </div>
          </div>
        )}

        {/* Error details */}
        {executionStatus.error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="font-medium text-red-700">Execution Error</p>
                <p className="text-sm text-red-600">{executionStatus.error}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
