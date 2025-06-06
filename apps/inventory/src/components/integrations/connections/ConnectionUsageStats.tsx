import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Activity, ArrowUpRight, BarChart, Clock, Shield } from "lucide-react";

interface ConnectionUsageStatsProps {
  connectionId?: string;
}

/**
 * Component to display connection usage statistics and metrics
 * Can show overall stats or stats for a specific connection if connectionId is provided
 */
export default function ConnectionUsageStats({
  connectionId,
}: ConnectionUsageStatsProps) {
  // Fetch connection usage statistics
  const stats = useQuery(
    connectionId
      ? api.integrations.connections.getConnectionStats
      : api.integrations.connections.getUsageStats,
    connectionId ? { connectionId } : undefined,
  );

  if (!stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">
            {connectionId ? "Connection Statistics" : "Connection Usage"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  // Render connection-specific stats
  if (connectionId) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Connection Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.totalCalls > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border p-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Total API Calls
                    </span>
                    <span className="text-2xl font-semibold">
                      {stats.totalCalls.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Success Rate
                    </span>
                    <span className="text-2xl font-semibold">
                      {stats.successRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Error Rate</span>
                  <span className="font-medium">
                    {stats.errorRate.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={stats.errorRate}
                  className="h-2"
                  indicatorClassName={
                    stats.errorRate > 20
                      ? "bg-destructive"
                      : stats.errorRate > 5
                        ? "bg-orange-500"
                        : "bg-green-500"
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Last 24 Hours
                  </span>
                  <span className="font-medium">
                    {stats.last24Hours.toLocaleString()} calls
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Avg Response Time
                  </span>
                  <span className="font-medium">
                    {stats.avgResponseTime
                      ? `${stats.avgResponseTime.toFixed(0)}ms`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Last Used
                  </span>
                  <span className="font-medium">
                    {stats.lastUsed
                      ? new Date(stats.lastUsed).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Token Refreshes
                  </span>
                  <span className="font-medium">
                    {stats.tokenRefreshes || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Uptime</span>
                </div>
                <span className="font-medium">
                  {stats.uptime ? `${stats.uptime.toFixed(1)}%` : "N/A"}
                </span>
              </div>

              <div className="pt-2">
                <a
                  href={`/integrations/performance?connection=${connectionId}`}
                  className="inline-flex items-center text-xs text-primary hover:underline"
                >
                  <BarChart className="mr-1 h-3 w-3" />
                  <span>View detailed analytics</span>
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </a>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <Shield className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
              <p>No usage data available for this connection</p>
              <p className="mt-1 text-xs">
                Stats will appear once the connection is used in scenarios
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render overall stats for all connections
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Connection Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.totalConnections > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Active Connections</span>
                <span className="font-medium">
                  {stats.activeConnections}/{stats.totalConnections}
                </span>
              </div>
              <Progress
                value={(stats.activeConnections / stats.totalConnections) * 100}
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="flex flex-col space-y-1">
                <span className="text-xs text-muted-foreground">Most Used</span>
                <span className="font-medium">
                  {stats.mostUsedApp || "N/A"}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs text-muted-foreground">
                  Error Rate
                </span>
                <span className="font-medium">
                  {stats.errorRate ? `${stats.errorRate.toFixed(1)}%` : "0%"}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs text-muted-foreground">
                  Calls Today
                </span>
                <span className="font-medium">
                  {stats.callsToday?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs text-muted-foreground">
                  Avg Response
                </span>
                <span className="font-medium">
                  {stats.avgResponseTime ? `${stats.avgResponseTime}ms` : "N/A"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/integrations/performance"
                className="inline-flex items-center text-xs text-primary hover:underline"
              >
                <BarChart className="mr-1 h-3 w-3" />
                <span>View detailed analytics</span>
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </a>
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <p>No connection data available</p>
            <p className="mt-1 text-xs">
              Add connections to view usage statistics
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
