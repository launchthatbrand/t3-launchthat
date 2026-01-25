"use client";

import * as React from "react";

import { useConvexAuth, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import {
  NotificationsAnalytics,
  type NotificationsAnalyticsSummary,
} from "launchthat-plugin-notifications/frontend";

export const PlatformNotificationsAnalyticsClient = () => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const daysBack = 30;
  const summary = useQuery(
    api.notifications.queries.getPlatformNotificationsAnalyticsSummary,
    shouldQuery ? { daysBack } : "skip",
  ) as NotificationsAnalyticsSummary | null | undefined;

  return <NotificationsAnalytics summary={summary} daysBack={daysBack} />;
};

