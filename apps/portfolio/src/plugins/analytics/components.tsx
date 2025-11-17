import {
  BarChart3,
  Clock,
  Download,
  Eye,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { HookContext } from "~/lib/hooks";
// Analytics Plugin Components
import React from "react";

// Analytics Tab Component
export const AnalyticsTab: React.FC<HookContext> = ({ postType, postId }) => {
  // Mock analytics data - in real app, this would come from an API
  const analyticsData = {
    views: 1247,
    uniqueVisitors: 892,
    avgTimeOnPage: "2:34",
    bounceRate: "34%",
    topReferrers: [
      { source: "Google", visits: 456 },
      { source: "Direct", visits: 234 },
      { source: "Social Media", visits: 123 },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-medium">Analytics Overview</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Eye className="h-4 w-4" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.views.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Unique Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.uniqueVisitors.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Avg. Time on Page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.avgTimeOnPage}
              </div>
              <p className="text-xs text-muted-foreground">Minutes:Seconds</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Bounce Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.bounceRate}
              </div>
              <p className="text-xs text-muted-foreground">Percentage</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.topReferrers.map((referrer, index) => (
              <div
                key={referrer.source}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-medium">{referrer.source}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {referrer.visits} visits
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
        <Button variant="outline">
          <BarChart3 className="mr-2 h-4 w-4" />
          View Full Analytics
        </Button>
      </div>

      {/* Debug info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">
            Analytics for {postType} ID: {postId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Analytics Sidebar Widget
export const AnalyticsWidget: React.FC<HookContext> = ({ postType }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4" />
          Quick Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Views Today</span>
          <Badge variant="secondary">23</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">This Week</span>
          <Badge variant="secondary">157</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">This Month</span>
          <Badge variant="secondary">1,247</Badge>
        </div>

        <Button variant="outline" size="sm" className="mt-3 w-full">
          <BarChart3 className="mr-2 h-3 w-3" />
          View Details
        </Button>

        <p className="text-xs text-muted-foreground">
          Analytics for {postType}
        </p>
      </CardContent>
    </Card>
  );
};
