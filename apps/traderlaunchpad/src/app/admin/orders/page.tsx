"use client";

import React from "react";
import { api } from "@convex-config/_generated/api";
import { TraderLaunchpadOrdersPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

export default function AdminOrdersPage() {
  return (
    <TraderLaunchpadOrdersPage
      api={{
        queries: api.traderlaunchpad.queries,
        actions: api.traderlaunchpad.actions,
      }}
    />
  );
}
