/**
 * PerformanceMetrics component
 *
 * Displays performance metrics and visualizations for scenario executions,
 * including benchmark comparisons and optimization recommendations.
 */
"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { timeAgo } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BarChartIcon,
  CalendarIcon,
  ClockIcon,
  TerminalIcon,
  ZapIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function PerformanceMetrics() {
  const [activeTab, setActiveTab] = useState("summary");

  // Get performance metrics from the API
  const metrics = useQuery(
    api.integrations.scenarios.performance.getPerformanceMetrics,
  );

  // Format durations nicely
  const formatDuration = (ms: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  // Prepare data for bar chart
  const prepareNodeTypeData = () => {
    if (!metrics?.nodeTypePerformance) return [];

    return Object.entries(metrics.nodeTypePerformance).map(([type, data]) => ({
      name: type,
      avgDuration: data.avgDuration,
      count: data.count,
      failureRate: data.failureRate * 100, // Convert to percentage
    }));
  };

  // Prepare data for timeline chart
  const prepareTimelineData = () => {
    if (!metrics?.executionTimeline) return [];

    return metrics.executionTimeline.map((point) => ({
      date: new Date(point.date).toLocaleDateString(),
      count: point.count,
      avgDuration: point.avgDuration,
      failureRate: point.failureRate * 100, // Convert to percentage
    }));
  };

  // Loading state
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Loading execution metrics...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (metrics.totalExecutions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>No execution data available yet</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <BarChartIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No metrics available</h3>
          <p className="text-sm text-muted-foreground">
            Run some scenario executions to generate performance metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend indicators
  const getDurationTrend = () => {
    if (!metrics.executionTimeline || metrics.executionTimeline.length < 2)
      return 0;

    const timeline = metrics.executionTimeline;
    const lastPoint = timeline[timeline.length - 1];
    const prevPoint = timeline[timeline.length - 2];

    if (lastPoint.avgDuration === prevPoint.avgDuration) return 0;
    return lastPoint.avgDuration > prevPoint.avgDuration ? 1 : -1;
  };

  const getFailureRateTrend = () => {
    if (!metrics.executionTimeline || metrics.executionTimeline.length < 2)
      return 0;

    const timeline = metrics.executionTimeline;
    const lastPoint = timeline[timeline.length - 1];
    const prevPoint = timeline[timeline.length - 2];

    if (lastPoint.failureRate === prevPoint.failureRate) return 0;
    return lastPoint.failureRate > prevPoint.failureRate ? 1 : -1;
  };

  const durationTrend = getDurationTrend();
  const failureRateTrend = getFailureRateTrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>
          Analysis of scenario execution performance over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="nodes">Node Types</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Total Executions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">
                        {metrics.totalExecutions}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metrics.lastExecution
                          ? `Last execution ${timeAgo(metrics.lastExecution)}`
                          : "No recent executions"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Execution Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <ClockIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center text-2xl font-bold">
                        {formatDuration(metrics.avgExecutionDuration)}
                        {durationTrend > 0 && (
                          <ArrowUpRightIcon className="ml-1 h-4 w-4 text-red-500" />
                        )}
                        {durationTrend < 0 && (
                          <ArrowDownRightIcon className="ml-1 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metrics.minExecutionDuration !== undefined &&
                        metrics.maxExecutionDuration !== undefined
                          ? `Range: ${formatDuration(metrics.minExecutionDuration)} - ${formatDuration(metrics.maxExecutionDuration)}`
                          : "No data available"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <ZapIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center text-2xl font-bold">
                        {((1 - metrics.failureRate) * 100).toFixed(1)}%
                        {failureRateTrend > 0 && (
                          <ArrowUpRightIcon className="ml-1 h-4 w-4 text-red-500" />
                        )}
                        {failureRateTrend < 0 && (
                          <ArrowDownRightIcon className="ml-1 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {`${metrics.successfulExecutions} successful, ${metrics.failedExecutions} failed`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Slowest Scenarios</CardTitle>
                <CardDescription>
                  Scenarios with the longest average execution time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.slowestScenarios &&
                metrics.slowestScenarios.length > 0 ? (
                  <div className="space-y-4">
                    {metrics.slowestScenarios.map((scenario, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-start gap-2">
                          <Badge>{index + 1}</Badge>
                          <div>
                            <div className="font-medium">{scenario.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {scenario.executionCount} executions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatDuration(scenario.avgDuration)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            avg. execution time
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No scenario data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Node Types Tab */}
          <TabsContent value="nodes">
            <Card>
              <CardHeader>
                <CardTitle>Node Type Performance</CardTitle>
                <CardDescription>
                  Comparison of performance metrics across different node types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-4 h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareNodeTypeData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#8884d8"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#82ca9d"
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "avgDuration")
                            return formatDuration(value as number);
                          if (name === "failureRate")
                            return `${(value as number).toFixed(1)}%`;
                          return value;
                        }}
                        labelFormatter={(label) => `Node Type: ${label}`}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="avgDuration"
                        name="Avg. Duration (ms)"
                        fill="#8884d8"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="failureRate"
                        name="Failure Rate (%)"
                        fill="#ff8042"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Slowest Node Types</CardTitle>
                  <CardDescription>
                    Node types with longest execution time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.entries(metrics.nodeTypePerformance || {})
                    .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
                    .slice(0, 5)
                    .map(([type, data], index) => (
                      <div
                        key={type}
                        className="mb-2 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{type}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">
                            {formatDuration(data.avgDuration)}
                          </span>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most Unreliable Node Types</CardTitle>
                  <CardDescription>
                    Node types with highest failure rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.entries(metrics.nodeTypePerformance || {})
                    .sort((a, b) => b[1].failureRate - a[1].failureRate)
                    .slice(0, 5)
                    .map(([type, data], index) => (
                      <div
                        key={type}
                        className="mb-2 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{type}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">
                            {(data.failureRate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Execution Metrics Over Time</CardTitle>
                <CardDescription>
                  Trends in execution performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-4 h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={prepareTimelineData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#8884d8"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#82ca9d"
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "avgDuration")
                            return formatDuration(value as number);
                          if (name === "failureRate")
                            return `${(value as number).toFixed(1)}%`;
                          return value;
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="avgDuration"
                        name="Avg. Duration"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="failureRate"
                        name="Failure Rate (%)"
                        stroke="#ff8042"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Execution Volume</CardTitle>
                <CardDescription>
                  Number of executions over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-4 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareTimelineData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Executions" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
