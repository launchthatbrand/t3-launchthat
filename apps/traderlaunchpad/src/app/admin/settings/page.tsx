"use client";

import React from "react";
import { api } from "@convex-config/_generated/api";
import { TraderLaunchpadSettingsPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

export default function AdminSettingsPage() {
  return (
    <TraderLaunchpadSettingsPage
      api={{
        queries: api.traderlaunchpad.queries,
        actions: api.traderlaunchpad.actions,
      }}
    />
  );
}
