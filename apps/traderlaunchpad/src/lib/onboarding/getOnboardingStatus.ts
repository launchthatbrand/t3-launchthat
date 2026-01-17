"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";

export type OnboardingStatus = {
  isLoading: boolean;
  connectedOk: boolean;
  syncOk: boolean;
  tradesOk: boolean;
  symbolOk: boolean;
  reviewOk: boolean;
  completedSteps: number;
  totalSteps: number;
  nextStepHref: string | null;
  isComplete: boolean;
};

export const useOnboardingStatus = (): OnboardingStatus => {
  const connectionData = useQuery(api.traderlaunchpad.queries.getMyTradeLockerConnection, {});
  const closedIdeas = useQuery(api.traderlaunchpad.queries.listMyTradeIdeasByStatus, {
    status: "closed",
    paginationOpts: { numItems: 1, cursor: null },
  }) as { page?: Array<any> } | undefined;
  const nextToReview = useQuery(api.traderlaunchpad.queries.listMyNextTradeIdeasToReview, {
    limit: 3,
  }) as Array<any> | undefined;

  return useMemo(() => {
    const isLoading =
      connectionData === undefined ||
      closedIdeas === undefined ||
      nextToReview === undefined;
    const status = connectionData?.connection?.status;
    const connectedOk = status === "connected";

    const now = Date.now();
    const lastSyncAt =
      typeof connectionData?.polling?.lastSyncAt === "number"
        ? connectionData.polling.lastSyncAt
        : 0;

    // "Meaningful" for onboarding: sync happened recently enough to trust.
    const syncOk = connectedOk && lastSyncAt > 0 && now - lastSyncAt < 24 * 60 * 60 * 1000;

    const hasClosedIdeas = Array.isArray(closedIdeas?.page) && closedIdeas!.page.length > 0;
    const tradesOk = connectedOk && syncOk && hasClosedIdeas;

    const candidateSymbol =
      typeof closedIdeas?.page?.[0]?.symbol === "string"
        ? String(closedIdeas.page[0].symbol).trim()
        : "";
    const symbolOk = tradesOk && Boolean(candidateSymbol);

    // For v1, treat "review done" as: user has closed trades and there are no remaining items in the next-to-review queue.
    const reviewOk =
      tradesOk && Array.isArray(nextToReview) && nextToReview.length === 0;

    const totalSteps = 3;
    const completedSteps =
      (connectedOk ? 1 : 0) + (tradesOk ? 1 : 0) + (reviewOk ? 1 : 0);

    const nextStepHref = !connectedOk
      ? "/admin/onboarding/connect"
      : !tradesOk
        ? "/admin/onboarding/sync"
        : !reviewOk
          ? "/admin/onboarding/first-review"
          : null;

    return {
      isLoading,
      connectedOk,
      syncOk,
      tradesOk,
      symbolOk,
      reviewOk,
      completedSteps,
      totalSteps,
      nextStepHref,
      isComplete: completedSteps >= totalSteps,
    };
  }, [closedIdeas?.page, connectionData, nextToReview]);
};

