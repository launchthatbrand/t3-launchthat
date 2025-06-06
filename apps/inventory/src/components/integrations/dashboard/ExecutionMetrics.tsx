import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatDistance } from "date-fns";
import { Activity, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Execution Metrics Dashboard
 *
 * Displays performance metrics and statistics for scenario executions
 */
export default function ExecutionMetrics() {
  const [activeTab, setActiveTab] = useState("overview");

  // Get performance metrics
  const metrics = useQuery(
    api.integrations.scenarios.performance.getPerformanceMetrics,
  );

  // Get active executions
  const activeExecutions = useQuery(
    api.integrations.scenarios.monitoring.getActiveExecutions,
  );

  if (!metrics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Execution Metrics</CardTitle>
          <CardDescription>Loading performance data...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Clock className="h-8 w-8 animate-pulse text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Execution Metrics</CardTitle>
        <CardDescription>
          Performance metrics and statistics for scenario executions
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="node-types">Node Types</TabsTrigger>
          </TabsList>
        </div>

        <CardContent>
          <TabsContent value="overview" className="space-y-4">
            {/* Summary statistics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Executions"
                value={metrics.totalExecutions}
                icon={<Activity className="h-4 w-4" />}
              />
              <StatCard
                title="Success Rate"
                value={`${(100 - metrics.failureRate * 100).toFixed(1)}%`}
                icon={<CheckCircle2 className="h-4 w-4" />}
                status={
                  metrics.failureRate < 0.1
                    ? "success"
                    : metrics.failureRate < 0.3
                      ? "warning"
                      : "error"
                }
              />
              <StatCard
                title="Avg Duration"
                value={formatDuration(metrics.avgExecutionDuration)}
                icon={<Clock className="h-4 w-4" />}
              />
              <StatCard
                title="Active Executions"
                value={activeExecutions?.length || 0}
                icon={<AlertCircle className="h-4 w-4" />}
              />
            </div>

            {/* Slowest Scenarios */}
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-medium">Slowest Scenarios</h3>
              {metrics.slowestScenarios.length > 0 ? (
                <div className="space-y-3">
                  {metrics.slowestScenarios.map((scenario, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-full">
                        <div className="mb-1 flex justify-between">
                          <span className="text-sm font-medium">
                            {scenario.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(scenario.avgDuration)}
                          </span>
                        </div>
                        <Progress
                          value={calculateProgressValue(
                            scenario.avgDuration,
                            metrics.maxExecutionDuration || 10000,
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No scenario execution data available
                </p>
              )}
            </div>

            {/* Active Executions */}
            {activeExecutions && activeExecutions.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-medium">Active Executions</h3>
                <div className="space-y-3">
                  {activeExecutions.map((execution) => (
                    <div key={execution._id} className="rounded-lg border p-4">
                      <div className="mb-2 flex justify-between">
                        <span className="font-medium">
                          {execution.scenarioName}
                        </span>
                        <Badge>{execution.currentNodeType || "unknown"}</Badge>
                      </div>
                      <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                        <span>
                          Started {formatTimeAgo(execution.startTime)}
                        </span>
                        <span>
                          {execution.estimatedTimeRemaining
                            ? `${formatDuration(execution.estimatedTimeRemaining)} remaining`
                            : "Calculating..."}
                        </span>
                      </div>
                      <Progress value={execution.progress ?? 0} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={metrics.executionTimeline}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    name="Executions"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgDuration"
                    name="Avg Duration (ms)"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="node-types" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(metrics.nodeTypePerformance).map(
                    ([type, data]) => ({
                      type,
                      avgDuration: data.avgDuration,
                      count: data.count,
                      failureRate: data.failureRate * 100,
                    }),
                  )}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" angle={-45} textAnchor="end" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="avgDuration"
                    name="Avg Duration (ms)"
                    fill="#8884d8"
                  />
                  <Bar dataKey="count" name="Execution Count" fill="#82ca9d" />
                  <Bar
                    dataKey="failureRate"
                    name="Failure Rate (%)"
                    fill="#ff7300"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

function StatCard({ title, value, icon, status = "default" }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground shadow">
      <div className="flex items-center justify-between space-x-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`text-${status}`}>{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTimeAgo(timestamp: number): string {
  return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
}

function calculateProgressValue(value: number, max: number): number {
  return Math.min(100, (value / max) * 100);
}
