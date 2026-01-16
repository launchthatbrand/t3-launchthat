"use client";

import React from "react";

import { api } from "../../../../convex/_generated/api";
import { TraderLaunchpadTradeIdeasPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

export default function AdminTradeIdeasPage() {
  return (
    <TraderLaunchpadTradeIdeasPage
      api={{
        queries: api.traderlaunchpad.queries,
        actions: api.traderlaunchpad.actions,
      }}
    />
  );
}

