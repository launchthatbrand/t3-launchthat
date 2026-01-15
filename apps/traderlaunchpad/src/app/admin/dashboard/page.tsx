"use client";

import React from "react";
import { api } from "@convex-config/_generated/api";
import { TraderLaunchpadDashboardPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

export default function AdminDashboardPage() {
  return (
    <TraderLaunchpadDashboardPage
      api={{
        queries: api.traderlaunchpad.queries,
        actions: api.traderlaunchpad.actions,
      }}
    />
  );
}
