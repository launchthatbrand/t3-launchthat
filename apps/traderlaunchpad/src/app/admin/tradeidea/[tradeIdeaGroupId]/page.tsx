"use client";

import React from "react";
import { useParams } from "next/navigation";

import { api } from "../../../../../convex/_generated/api";
import { TraderLaunchpadTradeIdeaDetailPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

export default function AdminTradeIdeaDetailRoute() {
  const params = useParams<{ tradeIdeaGroupId?: string | string[] }>();
  const raw = params?.tradeIdeaGroupId;
  const tradeIdeaGroupId = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";

  return (
    <TraderLaunchpadTradeIdeaDetailPage
      api={{
        queries: api.traderlaunchpad.queries,
        actions: api.traderlaunchpad.actions,
      }}
      tradeIdeaGroupId={tradeIdeaGroupId}
    />
  );
}

