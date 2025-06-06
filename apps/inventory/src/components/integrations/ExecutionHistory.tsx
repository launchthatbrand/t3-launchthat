/**
 * ExecutionHistory component
 *
 * Displays the execution history for a scenario, including statuses,
 * execution times, and summary information.
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatDistance } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Play,
} from "lucide-react";

interface ExecutionHistoryProps {
  scenarioId: Id<"scenarios">;
  onViewExecution?: (executionId: Id<"scenarioExecutions">) => void;
  onRunNow?: () => void;
  limit?: number;
}

export function ExecutionHistory({
  scenarioId,
  onViewExecution,
  onRunNow,
  limit = 5,
}: ExecutionHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<
    "running" | "completed" | "failed" | undefined
  >(undefined);

  const executions = useQuery(
    api.integrations.scenarios.execution.getScenarioExecutions,
    {
      scenarioId,
      limit,
      status: statusFilter,
    },
  );

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700"
          >
            <Clock className="mr-1 h-3 w-3" />
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

  // Format the trigger information
  const formatTrigger = (trigger: any) => {
    if (!trigger) return "Unknown";

    switch (trigger.type) {
      case "manual":
        return "Manual Run";
      case "webhook":
        return `Webhook: ${trigger.source || "Unknown"}`;
      case "polling":
        return `Polling: ${trigger.source || "Unknown"}`;
      case "scheduled":
        return `Scheduled: ${trigger.schedule || "Unknown"}`;
      default:
        return trigger.type || "Unknown";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>Recent executions of this scenario</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          {onRunNow && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center"
              onClick={onRunNow}
            >
              <Play className="mr-1 h-4 w-4" />
              Run Now
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex space-x-2">
          <Button
            size="sm"
            variant={statusFilter === undefined ? "default" : "outline"}
            onClick={() => setStatusFilter(undefined)}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "running" ? "default" : "outline"}
            onClick={() => setStatusFilter("running")}
          >
            Running
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "completed" ? "default" : "outline"}
            onClick={() => setStatusFilter("completed")}
          >
            Completed
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "failed" ? "default" : "outline"}
            onClick={() => setStatusFilter("failed")}
          >
            Failed
          </Button>
        </div>

        {executions === undefined ? (
          <div className="py-10 text-center text-gray-500">
            Loading executions...
          </div>
        ) : executions.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No executions found. Run the scenario to see results here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Results</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution._id.toString()}>
                  <TableCell>{getStatusBadge(execution.status)}</TableCell>
                  <TableCell>{formatTrigger(execution.trigger)}</TableCell>
                  <TableCell>
                    {formatDistance(execution.startTime, new Date(), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    {execution.duration
                      ? `${Math.round(execution.duration / 1000)}s`
                      : "In progress"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        {execution.nodeStats.completed}
                      </Badge>
                      {execution.nodeStats.failed > 0 && (
                        <Badge
                          variant="outline"
                          className="border-red-200 bg-red-50"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {execution.nodeStats.failed}
                        </Badge>
                      )}
                      {execution.nodeStats.skipped > 0 && (
                        <Badge
                          variant="outline"
                          className="border-yellow-200 bg-yellow-50"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {execution.nodeStats.skipped}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {onViewExecution && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewExecution(execution._id)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
