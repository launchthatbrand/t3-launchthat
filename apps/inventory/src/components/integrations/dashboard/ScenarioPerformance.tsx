import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Activity, AlertCircle, BarChart, Clock } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ScenarioPerformanceProps {
  scenarioId: string;
}

/**
 * Scenario Performance Details
 *
 * Shows detailed performance metrics for a specific scenario
 */
export default function ScenarioPerformance({
  scenarioId,
}: ScenarioPerformanceProps) {
  // Get performance metrics for this scenario
  const metrics = useQuery(
    api.integrations.scenarios.performance.getScenarioPerformanceMetrics,
    {
      scenarioId,
    },
  );

  // Get recent executions for this scenario
  const recentExecutions = useQuery(
    api.integrations.scenarios.monitoring.getRecentExecutions,
    {
      scenarioId,
      limit: 10,
    },
  );

  if (!metrics || !recentExecutions) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Scenario Performance</CardTitle>
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

  // Format benchmark data if available
  const benchmarkData =
    metrics.benchmarks?.map((benchmark) => ({
      date: new Date(benchmark.timestamp).toLocaleDateString(),
      duration: benchmark.duration,
      iterations: benchmark.iterations,
      optimized: benchmark.optimized ? "Yes" : "No",
    })) || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Performance Analysis</CardTitle>
        <CardDescription>
          Detailed performance metrics and optimization suggestions
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nodes">Node Analysis</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-6">
            {/* Metrics summary */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard
                title="Execution Success Rate"
                value={`${(metrics.insights?.successRate * 100).toFixed(1)}%`}
                icon={<Activity />}
              />
              <MetricCard
                title="Average Duration"
                value={formatDuration(metrics.avgExecutionDuration)}
                icon={<Clock />}
              />
              <MetricCard
                title="Node Count"
                value={metrics.nodeMetrics?.length || 0}
                icon={<BarChart />}
              />
            </div>

            {/* Optimization insights */}
            {metrics.insights?.recommendations?.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-lg font-medium">
                  Optimization Recommendations
                </h3>
                <ul className="space-y-2">
                  {metrics.insights.recommendations.map((recommendation, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent executions */}
            {recentExecutions.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-medium">Recent Executions</h3>
                <div className="space-y-3">
                  {recentExecutions.map((execution) => (
                    <div
                      key={execution._id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(execution.startTime).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {execution.duration
                            ? formatDuration(execution.duration)
                            : "In progress"}
                        </div>
                      </div>
                      <Badge
                        className={
                          execution.status === "completed"
                            ? "bg-green-500"
                            : execution.status === "failed"
                              ? "bg-red-500"
                              : "bg-blue-500"
                        }
                      >
                        {execution.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution trend */}
            {metrics.executionTrend?.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-medium">
                  Execution Duration Trend
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.executionTrend.map((item) => ({
                        date: new Date(item.date).toLocaleDateString(),
                        duration: item.duration,
                        status: item.status,
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatDuration(value as number)}
                      />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        name="Duration"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="nodes" className="pt-6">
            {/* Node performance metrics */}
            {metrics.nodeMetrics?.length > 0 ? (
              <div>
                <h3 className="mb-4 text-lg font-medium">Node Performance</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={metrics.nodeMetrics.map((node) => ({
                        nodeId: node.nodeId.toString().slice(-4),
                        type: node.type,
                        avgDuration: node.avgDuration,
                        failureRate: node.failureRate * 100,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="nodeId"
                        angle={-45}
                        textAnchor="end"
                        tick={{ fontSize: 12 }}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "avgDuration")
                            return formatDuration(value as number);
                          if (name === "failureRate") return `${value}%`;
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="avgDuration"
                        name="Avg Duration"
                        fill="#8884d8"
                      />
                      <Bar
                        dataKey="failureRate"
                        name="Failure Rate (%)"
                        fill="#ff7300"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8">
                  <h3 className="mb-4 text-lg font-medium">Node Types</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {metrics.nodeMetrics.map((node) => (
                      <div key={node.nodeId} className="rounded-md border p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {node.nodeId.toString().slice(-4)}
                            </div>
                            <Badge className="mt-1">{node.type}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              {formatDuration(node.avgDuration)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {node.executionCount} executions
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Node Data</h3>
                <p className="text-sm text-muted-foreground">
                  Run this scenario to collect node performance data
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="benchmarks" className="pt-6">
            {/* Benchmark results */}
            {benchmarkData.length > 0 ? (
              <div>
                <h3 className="mb-4 text-lg font-medium">Benchmark Results</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={benchmarkData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "duration")
                            return formatDuration(value as number);
                          return value;
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        name="Duration"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Optimization gains */}
                {metrics.insights?.optimizationGain && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-lg font-medium">
                      Optimization Results
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <MetricCard
                        title="Standard Execution"
                        value={formatDuration(
                          metrics.insights.optimizationGain.standard,
                        )}
                        icon={<Clock />}
                      />
                      <MetricCard
                        title="Optimized Execution"
                        value={formatDuration(
                          metrics.insights.optimizationGain.optimized,
                        )}
                        icon={<Clock />}
                      />
                      <MetricCard
                        title="Improvement"
                        value={`${metrics.insights.optimizationGain.improvement.toFixed(1)}%`}
                        icon={<Activity />}
                      />
                    </div>
                  </div>
                )}

                {/* Benchmark details */}
                <div className="mt-8">
                  <h3 className="mb-4 text-lg font-medium">
                    Benchmark Details
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Date</th>
                        <th className="py-2 text-left">Duration</th>
                        <th className="py-2 text-left">Iterations</th>
                        <th className="py-2 text-left">Optimized</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarkData.map((benchmark, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{benchmark.date}</td>
                          <td className="py-2">
                            {formatDuration(benchmark.duration)}
                          </td>
                          <td className="py-2">{benchmark.iterations}</td>
                          <td className="py-2">{benchmark.optimized}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Benchmark Data</h3>
                <p className="text-sm text-muted-foreground">
                  Run a benchmark on this scenario to analyze performance
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground shadow">
      <div className="flex items-center justify-between space-x-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-muted-foreground">{icon}</div>
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
