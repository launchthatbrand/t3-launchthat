"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExecutionDetailsPanel from "@/components/integrations/ExecutionDetailsPanel";
import ExecutionLiveView from "@/components/integrations/ExecutionLiveView";
import ExecutionMonitor from "@/components/integrations/ExecutionMonitor";
import PerformanceMetrics from "@/components/integrations/PerformanceMetrics";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { timeAgo } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  BarChart,
  CheckIcon,
  ClockIcon,
  FileIcon,
  InfoIcon,
  PlayIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";

export default function ExecutionsPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedExecution, setSelectedExecution] =
    useState<Id<"scenario_executions"> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get active executions for monitoring panel
  const activeExecutions = useQuery(
    api.integrations.scenarios.monitoring.getActiveExecutions,
  );

  // Get all executions
  const allExecutions = useQuery(
    api.integrations.scenarios.execution.listExecutions,
    {
      limit: 20,
    },
  );

  // Get executions by status based on active tab
  const completedExecutions = useQuery(
    api.integrations.scenarios.execution.listExecutions,
    {
      status: "completed",
      limit: 20,
    },
  );

  const failedExecutions = useQuery(
    api.integrations.scenarios.execution.listExecutions,
    {
      status: "failed",
      limit: 20,
    },
  );

  // Function to manually refresh the data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Wait for a brief delay to simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Format execution status with an icon badge
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
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Scenario Executions
          </h1>
          <p className="text-muted-foreground">
            Monitor and review scenario executions
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isRefreshing}
        >
          <RefreshCwIcon
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="active">Active Executions</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="details">
            {selectedExecution ? "Execution Details" : "Select an Execution"}
          </TabsTrigger>
        </TabsList>

        {/* Active Executions Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Executions</CardTitle>
              <CardDescription>
                Real-time monitoring of currently running scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!activeExecutions || activeExecutions.length === 0 ? (
                <div className="py-12 text-center">
                  <PlayIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">
                    No active executions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    There are no scenarios currently running. Start a scenario
                    execution to monitor it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeExecutions.map((execution) => (
                    <Card
                      key={execution._id.toString()}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <PlayIcon className="h-5 w-5 text-blue-500" />
                          <div>
                            <h4 className="font-medium">
                              {execution.scenario.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Started {timeAgo(execution.startTime)}
                            </p>
                          </div>
                          {getStatusBadge(execution.status)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedExecution(execution._id);
                              setActiveTab("details");
                            }}
                          >
                            <InfoIcon className="mr-1 h-4 w-4" /> Details
                          </Button>
                        </div>
                      </div>
                      <div className="px-4 pb-4 pt-0">
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{execution.progress}% Complete</span>
                          <span className="text-muted-foreground">
                            <ClockIcon className="mr-1 inline h-3 w-3" />
                            {formatDuration(execution.duration)}
                          </span>
                        </div>
                        <Progress value={execution.progress} className="h-2" />

                        <div className="mt-3 grid grid-cols-5 gap-1">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">
                              Total
                            </div>
                            <div className="text-sm font-medium">
                              {execution.nodeStats.total}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">
                              Completed
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {execution.nodeStats.completed}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">
                              Running
                            </div>
                            <div className="text-sm font-medium text-blue-600">
                              {execution.nodeStats.running}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">
                              Skipped
                            </div>
                            <div className="text-sm font-medium text-amber-600">
                              {execution.nodeStats.skipped}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">
                              Failed
                            </div>
                            <div className="text-sm font-medium text-red-600">
                              {execution.nodeStats.failed}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Realtime monitoring component */}
          <div className="mt-6">
            <ExecutionMonitor />
          </div>
        </TabsContent>

        {/* Execution History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                View past scenario executions and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>

                {/* All Executions Tab */}
                <TabsContent value="all">
                  {!allExecutions || allExecutions.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium">
                        No execution history
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        There are no recorded scenario executions yet.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Scenario</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allExecutions.map((execution) => (
                          <TableRow key={execution._id.toString()}>
                            <TableCell className="font-medium">
                              {execution.scenarioName}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(execution.status)}
                            </TableCell>
                            <TableCell>
                              {timeAgo(execution.startTime)}
                            </TableCell>
                            <TableCell>
                              {execution.endTime
                                ? formatDuration(
                                    execution.endTime - execution.startTime,
                                  )
                                : "In progress"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedExecution(execution._id);
                                  setActiveTab("details");
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Completed Executions Tab */}
                <TabsContent value="completed">
                  {!completedExecutions || completedExecutions.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium">
                        No completed executions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        There are no completed scenario executions yet.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Scenario</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedExecutions.map((execution) => (
                          <TableRow key={execution._id.toString()}>
                            <TableCell className="font-medium">
                              {execution.scenarioName}
                            </TableCell>
                            <TableCell>
                              {timeAgo(execution.startTime)}
                            </TableCell>
                            <TableCell>
                              {execution.endTime
                                ? formatDuration(
                                    execution.endTime - execution.startTime,
                                  )
                                : "In progress"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedExecution(execution._id);
                                  setActiveTab("details");
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Failed Executions Tab */}
                <TabsContent value="failed">
                  {!failedExecutions || failedExecutions.length === 0 ? (
                    <div className="py-12 text-center">
                      <XIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium">
                        No failed executions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        There are no failed scenario executions.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Scenario</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Error</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {failedExecutions.map((execution) => (
                          <TableRow key={execution._id.toString()}>
                            <TableCell className="font-medium">
                              {execution.scenarioName}
                            </TableCell>
                            <TableCell>
                              {timeAgo(execution.startTime)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-red-600">
                              {execution.error || "Unknown error"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedExecution(execution._id);
                                  setActiveTab("details");
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Performance metrics component */}
          <div className="mt-6">
            <PerformanceMetrics />
          </div>
        </TabsContent>

        {/* Execution Details Tab */}
        <TabsContent value="details">
          {selectedExecution ? (
            <ExecutionDetailsPanel
              executionId={selectedExecution}
              onClose={() => setSelectedExecution(null)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Execution Details</CardTitle>
                <CardDescription>
                  Select an execution to view detailed information
                </CardDescription>
              </CardHeader>
              <CardContent className="py-12 text-center">
                <InfoIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  No execution selected
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select an execution from the Active Executions or Execution
                  History tabs to view its details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
