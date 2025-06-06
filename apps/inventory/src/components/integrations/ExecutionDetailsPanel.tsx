import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { timeAgo } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  AlertTriangleIcon,
  BarChartIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  PauseIcon,
  PlayIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";

interface ExecutionDetailsPanelProps {
  executionId: Id<"scenario_executions">;
  onClose?: () => void;
}

export default function ExecutionDetailsPanel({
  executionId,
  onClose,
}: ExecutionDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Use the subscription endpoint to get real-time updates
  const executionData = useQuery(
    api.integrations.scenarios.monitoring.subscribeToExecution,
    { executionId },
  );

  // Get detailed performance metrics if the execution is complete
  const performanceMetrics = useQuery(
    api.integrations.scenarios.monitoring.getExecutionPerformanceMetrics,
    { executionId },
    { enabled: executionData?.status === "completed" },
  );

  // Function to toggle node expansion
  const toggleNodeExpansion = (nodeId: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (expandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    setExpandedNodes(newExpandedNodes);
  };

  // Auto-refresh disable timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      executionData?.status === "completed" ||
      executionData?.status === "failed"
    ) {
      // Disable auto-refresh after 30 seconds when execution is complete
      timer = setTimeout(() => {
        setAutoRefresh(false);
      }, 30000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [executionData?.status]);

  if (!executionData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Execution Details</CardTitle>
          <CardDescription>Loading execution data...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <RefreshCwIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Format execution status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-blue-500">
            <PlayIcon className="mr-1 h-3 w-3" /> Running
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500">
            <CheckIcon className="mr-1 h-3 w-3" /> Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500">
            <XIcon className="mr-1 h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format durations nicely
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Execution Details</CardTitle>
          <CardDescription>
            Started {timeAgo(executionData.startTime)}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(executionData.status)}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
          >
            {autoRefresh ? (
              <PauseIcon className="h-4 w-4" />
            ) : (
              <RefreshCwIcon className="h-4 w-4" />
            )}
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nodes">Node Details</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {executionData.status === "running" ? (
                      <span className="flex items-center text-blue-500">
                        <PlayIcon className="mr-2 h-5 w-5" /> Running
                      </span>
                    ) : executionData.status === "completed" ? (
                      <span className="flex items-center text-green-500">
                        <CheckIcon className="mr-2 h-5 w-5" /> Completed
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500">
                        <XIcon className="mr-2 h-5 w-5" /> Failed
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">
                    {executionData.progress ?? 0}%
                  </div>
                  <Progress value={executionData.progress ?? 0} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-2xl font-bold">
                    <ClockIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                    {executionData.endTime
                      ? formatDuration(
                          executionData.endTime - executionData.startTime,
                        )
                      : formatDuration(Date.now() - executionData.startTime)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="py-4">
                <CardTitle>Node Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <div className="rounded-md bg-muted p-2 text-center">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-xl font-bold">
                      {executionData.nodeStats.total}
                    </div>
                  </div>
                  <div className="rounded-md bg-green-100 p-2 text-center dark:bg-green-950">
                    <div className="text-sm text-muted-foreground">
                      Completed
                    </div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {executionData.nodeStats.completed}
                    </div>
                  </div>
                  <div className="rounded-md bg-blue-100 p-2 text-center dark:bg-blue-950">
                    <div className="text-sm text-muted-foreground">Running</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {executionData.nodeStats.running}
                    </div>
                  </div>
                  <div className="rounded-md bg-amber-100 p-2 text-center dark:bg-amber-950">
                    <div className="text-sm text-muted-foreground">Skipped</div>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {executionData.nodeStats.skipped}
                    </div>
                  </div>
                  <div className="rounded-md bg-red-100 p-2 text-center dark:bg-red-950">
                    <div className="text-sm text-muted-foreground">Failed</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {executionData.nodeStats.failed}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {executionData.status === "running" &&
              executionData.estimatedTimeRemaining && (
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle>Estimated Time Remaining</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatDuration(executionData.estimatedTimeRemaining)}
                    </div>
                  </CardContent>
                </Card>
              )}
          </TabsContent>

          {/* Nodes Tab */}
          <TabsContent value="nodes" className="space-y-4">
            <div className="space-y-2">
              {executionData.nodeResults?.map((node: any) => (
                <Card key={node.nodeId} className="overflow-hidden">
                  <div
                    className="flex cursor-pointer items-center justify-between p-4"
                    onClick={() => toggleNodeExpansion(node.nodeId)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedNodes.has(node.nodeId) ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                      <span className="font-medium">{node.type || "Node"}</span>
                      <Badge
                        variant="outline"
                        className={
                          node.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            : node.status === "running"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : node.status === "skipped"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : node.status === "failed"
                                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                  : ""
                        }
                      >
                        {node.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {node.startTime && node.endTime && (
                        <span>
                          {formatDuration(node.endTime - node.startTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  {expandedNodes.has(node.nodeId) && (
                    <div className="px-4 pb-4 pt-0">
                      <Separator className="mb-4" />
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="mb-2 text-sm font-medium">Input</h4>
                          <pre className="max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">
                            {JSON.stringify(node.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-medium">Output</h4>
                          <pre className="max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">
                            {JSON.stringify(node.output, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {node.error && (
                        <div className="mt-4">
                          <h4 className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
                            Error
                          </h4>
                          <div className="rounded-md bg-red-100 p-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
                            {node.error}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            {executionData.status !== "completed" ? (
              <div className="p-8 text-center">
                <AlertTriangleIcon className="mx-auto mb-2 h-10 w-10 text-amber-500" />
                <h3 className="text-lg font-medium">
                  Performance analysis is only available for completed
                  executions
                </h3>
              </div>
            ) : !performanceMetrics ? (
              <div className="flex h-64 items-center justify-center">
                <RefreshCwIcon className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium">
                        Total Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatDuration(performanceMetrics.totalDuration)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium">
                        Avg. Node Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatDuration(performanceMetrics.avgNodeDuration)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium">
                        Slowest Node
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {performanceMetrics.slowestNode.type}
                        </div>
                        <div className="text-xl font-bold">
                          {formatDuration(
                            performanceMetrics.slowestNode.duration,
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Node Performance</CardTitle>
                    <CardDescription>
                      Duration of each node execution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceMetrics.nodeMetrics
                        .sort((a, b) => b.duration - a.duration)
                        .map((node) => (
                          <div
                            key={node.nodeId.toString()}
                            className="space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    node.status === "completed"
                                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                      : node.status === "skipped"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                        : node.status === "failed"
                                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                          : ""
                                  }
                                >
                                  {node.status}
                                </Badge>
                                <span className="text-sm">{node.type}</span>
                              </div>
                              <span className="text-sm font-medium">
                                {formatDuration(node.duration)}
                              </span>
                            </div>
                            <Progress
                              value={Math.min(
                                100,
                                (node.duration /
                                  performanceMetrics.slowestNode.duration) *
                                  100,
                              )}
                              className={
                                node.status === "completed"
                                  ? "bg-green-100 dark:bg-green-950"
                                  : node.status === "skipped"
                                    ? "bg-amber-100 dark:bg-amber-950"
                                    : node.status === "failed"
                                      ? "bg-red-100 dark:bg-red-950"
                                      : ""
                              }
                            />
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="text-sm text-muted-foreground">
        {executionData.lastUpdated && (
          <div>Last updated: {timeAgo(executionData.lastUpdated)}</div>
        )}
      </CardFooter>
    </Card>
  );
}
