import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
/**
 * ExecutionDetails component
 *
 * Displays detailed information about a scenario execution,
 * including individual node execution results.
 */
import { useQuery } from "convex/react";
import { format, formatDistance } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Check,
  ChevronLeft,
  Clock,
  Code,
  Play,
} from "lucide-react";

interface ExecutionDetailsProps {
  executionId: Id<"scenarioExecutions">;
  onBack?: () => void;
  onRerun?: () => void;
}

export function ExecutionDetails({
  executionId,
  onBack,
  onRerun,
}: ExecutionDetailsProps) {
  const executionDetails = useQuery(
    api.integrations.scenarios.execution.getExecutionDetails,
    {
      executionId,
    },
  );

  if (!executionDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Details</CardTitle>
          <CardDescription>Loading execution details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center text-gray-500">
            Loading execution details...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate duration
  const duration = executionDetails.duration
    ? `${Math.round(executionDetails.duration / 1000)}s`
    : "In progress";

  // Get the node results sorted by start time
  const nodeResults = [...(executionDetails.nodeResults || [])].sort(
    (a, b) => a.startTime - b.startTime,
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
            <CardTitle>Execution Details</CardTitle>
            <CardDescription>
              {executionDetails.scenario?.name || "Scenario"} execution details
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(executionDetails.status)}
          {onRerun && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center"
              onClick={onRerun}
            >
              <Play className="mr-1 h-4 w-4" />
              Run Again
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <h4 className="mb-1 text-sm font-semibold text-gray-500">
              Started
            </h4>
            <p className="text-sm">
              {format(executionDetails.startTime, "MMM d, yyyy HH:mm:ss")}
              <span className="block text-xs text-gray-500">
                {formatDistance(executionDetails.startTime, new Date(), {
                  addSuffix: true,
                })}
              </span>
            </p>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold text-gray-500">
              Duration
            </h4>
            <p className="text-sm">{duration}</p>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold text-gray-500">
              Trigger
            </h4>
            <p className="text-sm">{formatTrigger(executionDetails.trigger)}</p>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold text-gray-500">
              Node Results
            </h4>
            <div className="flex space-x-2">
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 text-xs"
              >
                <Check className="mr-1 h-3 w-3" />
                {nodeResults.filter((n) => n.status === "completed").length}
              </Badge>
              {nodeResults.filter((n) => n.status === "failed").length > 0 && (
                <Badge
                  variant="outline"
                  className="border-red-200 bg-red-50 text-xs"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {nodeResults.filter((n) => n.status === "failed").length}
                </Badge>
              )}
              {nodeResults.filter((n) => n.status === "skipped").length > 0 && (
                <Badge
                  variant="outline"
                  className="border-yellow-200 bg-yellow-50 text-xs"
                >
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {nodeResults.filter((n) => n.status === "skipped").length}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <h3 className="mb-4 text-lg font-medium">Node Executions</h3>
        {nodeResults.length === 0 ? (
          <div className="py-6 text-center text-gray-500">
            No node executions found.
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {nodeResults.map((result, index) => {
              const nodeDuration = result.endTime
                ? `${Math.round((result.endTime - result.startTime) / 1000)}s`
                : "In progress";

              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className={
                    result.status === "failed"
                      ? "border-red-200 bg-red-50"
                      : result.status === "skipped"
                        ? "border-yellow-200 bg-yellow-50"
                        : ""
                  }
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                          {index + 1}
                        </span>
                        <span className="font-medium">
                          {result.nodeId
                            ? result.nodeId.toString().slice(0, 8)
                            : "Unknown Node"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">
                          {nodeDuration}
                        </span>
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="mb-2 flex items-center text-sm font-semibold">
                          <Code className="mr-1 h-4 w-4" /> Input
                        </h4>
                        <pre className="max-h-60 overflow-auto rounded-md bg-gray-100 p-3 text-xs">
                          {JSON.stringify(result.input || {}, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="mb-2 flex items-center text-sm font-semibold">
                          <Code className="mr-1 h-4 w-4" />{" "}
                          {result.status === "failed" ? "Error" : "Output"}
                        </h4>
                        <pre
                          className={`max-h-60 overflow-auto rounded-md p-3 text-xs ${
                            result.status === "failed"
                              ? "bg-red-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {result.status === "failed"
                            ? JSON.stringify(result.error || {}, null, 2)
                            : JSON.stringify(result.output || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {executionDetails.error && (
          <div className="mt-6">
            <h3 className="mb-2 text-lg font-medium text-red-600">
              Execution Error
            </h3>
            <pre className="max-h-60 overflow-auto rounded-md bg-red-100 p-3 text-xs">
              {JSON.stringify(executionDetails.error, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
