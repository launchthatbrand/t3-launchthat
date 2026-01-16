"use client";

import React from "react";

import { api } from "../../../../convex/_generated/api";
import { TraderLaunchpadAnalyticsPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

export default function AdminAnalyticsPage() {
  return (
    <TraderLaunchpadAnalyticsPage
      api={{
        queries: api.traderlaunchpad.queries,
        actions: api.traderlaunchpad.actions,
      }}
    />
  );
}

