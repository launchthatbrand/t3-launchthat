import { BarChart3, Eye, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { Plugin, PluginContext } from "../types";

import { Badge } from "@acme/ui/badge";
import React from "react";

// Analytics Tab Component
const AnalyticsTab: React.FC<PluginContext> = ({
  postType: _postType,
  postId: _postId,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-medium">Analytics Overview</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Eye className="h-4 w-4" />
                Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +20% from last week
              </p>
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
              <div className="text-2xl font-bold">567</div>
              <p className="text-xs text-muted-foreground">
                +15% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2m</div>
              <p className="text-xs text-muted-foreground">
                Average time on page
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h4 className="text-md mb-3 font-medium">Recent Activity</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Page viewed</span>
            <Badge variant="secondary">2 minutes ago</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Comment added</span>
            <Badge variant="secondary">5 minutes ago</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Share on social media</span>
            <Badge variant="secondary">10 minutes ago</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Sidebar Widget
const AnalyticsWidget: React.FC<PluginContext> = ({
  postType: _postType,
  postId: _postId,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Today's Views</span>
          <span className="font-medium">89</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">This Week</span>
          <span className="font-medium">623</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-medium">12,456</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Analytics Header Button
const AnalyticsHeaderButton: React.FC<PluginContext> = ({
  postType,
  postId,
}) => {
  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <BarChart3 className="h-3 w-3" />
      Analytics Active
    </Badge>
  );
};

// Plugin Definition
export const analyticsPlugin: Plugin = {
  id: "analytics",
  name: "Analytics Dashboard",
  version: "1.0.0",
  description: "Provides detailed analytics and statistics for posts",
  author: "System",

  areas: ["admin.post"],

  tabs: [
    {
      id: "analytics",
      label: "Analytics",
      component: AnalyticsTab,
      order: 100,
      icon: BarChart3,
      condition: (context) => {
        // Only show for published content
        return context.postType !== undefined;
      },
    },
  ],

  sidebar: [
    {
      position: "top",
      component: AnalyticsWidget,
      order: 1,
      condition: (context) => {
        // Show for all post types
        return context.postType !== undefined;
      },
    },
  ],

  slots: {
    "admin.post.header.actions": [
      {
        component: AnalyticsHeaderButton,
        order: 1,
      },
    ],
  },

  onActivate: async (context) => {
    console.log("Analytics plugin activated for:", context.postType);
  },

  onDeactivate: async (context) => {
    console.log("Analytics plugin deactivated for:", context.postType);
  },
};
