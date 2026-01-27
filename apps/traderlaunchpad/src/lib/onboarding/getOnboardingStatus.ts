"use client";

import { useMemo } from "react";
import { useConvexAuth, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export interface OnboardingStatus {
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
}

export const useOnboardingStatus = (): OnboardingStatus => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const entitlements = useQuery(
    api.accessPolicy.getMyEntitlements,
    shouldQuery ? {} : "skip",
  ) as
    | {
        isSignedIn: boolean;
        features: { journal: boolean };
      }
    | undefined;
  const canUseJournal = Boolean(entitlements?.features?.journal);

  // Gate queries until Convex auth is ready. This prevents transient "Unauthorized"
  // errors on first load when Clerk/Convex auth is still hydrating.
  const connectionData = useQuery(
    api.traderlaunchpad.queries.getMyTradeLockerConnection,
    shouldQuery && canUseJournal ? {} : "skip",
  );
  const closedIdeas = useQuery(
    api.traderlaunchpad.queries.listMyTradeIdeasByStatus,
    shouldQuery
      ? {
          status: "closed",
          paginationOpts: { numItems: 1, cursor: null },
        }
      : "skip",
  ) as { page?: unknown[] } | undefined;
  const nextToReview = useQuery(
    api.traderlaunchpad.queries.listMyNextTradeIdeasToReview,
    shouldQuery ? { limit: 3 } : "skip",
  ) as unknown[] | undefined;

  return useMemo(() => {
    const isLoading =
      authLoading ||
      !isAuthenticated ||
      connectionData === undefined ||
      closedIdeas === undefined ||
      nextToReview === undefined;

    const connection: UnknownRecord | null =
      isRecord(connectionData) && isRecord(connectionData.connection)
        ? connectionData.connection
        : null;
    const polling: UnknownRecord | null =
      isRecord(connectionData) && isRecord(connectionData.polling)
        ? connectionData.polling
        : null;

    const status =
      typeof connection?.status === "string" ? connection.status : null;
    const connectedOk = status === "connected";

    const now = Date.now();
    const lastSyncAt =
      typeof polling?.lastSyncAt === "number"
        ? polling.lastSyncAt
        : 0;

    // "Meaningful" for onboarding: sync happened recently enough to trust.
    const syncOk = connectedOk && lastSyncAt > 0 && now - lastSyncAt < 24 * 60 * 60 * 1000;

    const closedIdeasPage = Array.isArray(closedIdeas?.page) ? closedIdeas.page : [];
    const hasClosedIdeas = closedIdeasPage.length > 0;
    const tradesOk = connectedOk && syncOk && hasClosedIdeas;

    const firstClosed = closedIdeasPage[0];
    const candidateSymbol =
      isRecord(firstClosed) && typeof firstClosed.symbol === "string"
        ? firstClosed.symbol.trim()
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
  }, [authLoading, closedIdeas, connectionData, isAuthenticated, nextToReview]);
};

