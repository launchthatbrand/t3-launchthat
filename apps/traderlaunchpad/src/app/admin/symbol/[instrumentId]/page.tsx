"use client";

import React from "react";
import { useParams } from "next/navigation";

import { api } from "../../../../../convex/_generated/api";
import { TraderLaunchpadSymbolTradesPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

export default function AdminSymbolTradesPage() {
  const params = useParams<{ instrumentId?: string | string[] }>();
  const instrumentIdRaw = params?.instrumentId;
  const instrumentId = Array.isArray(instrumentIdRaw)
    ? instrumentIdRaw[0] ?? ""
    : instrumentIdRaw ?? "";

  return (
    <TraderLaunchpadSymbolTradesPage
      api={{
        queries: api.traderlaunchpad.queries,
        mutations: api.traderlaunchpad.mutations,
        actions: api.traderlaunchpad.actions,
      }}
      instrumentId={instrumentId}
    />
  );
}

