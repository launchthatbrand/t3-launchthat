"use client";

import React from "react";

import { api } from "../../../../convex/_generated/api";
import { TraderLaunchpadAccountTab } from "launchthat-plugin-traderlaunchpad/frontend/journal";

export default function JournalSettingsPage() {
  return (
    <TraderLaunchpadAccountTab
      api={{ queries: api.traderlaunchpad.queries, actions: api.traderlaunchpad.actions }}
      initialTab="settings"
    />
  );
}


