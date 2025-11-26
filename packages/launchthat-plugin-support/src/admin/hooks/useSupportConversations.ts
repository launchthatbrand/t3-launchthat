"use client";

import type { GenericId as Id } from "convex/values";
import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import type { ConversationSummary } from "../components/ConversationInspector";

export const useSupportConversations = (
  organizationId: Id<"organizations">,
  limit = 100,
) => {
  const conversations = useQuery(
    api.plugins.support.queries.listConversations,
    { organizationId, limit },
  ) as ConversationSummary[] | undefined;

  return useMemo(
    () => conversations ?? [],
    [conversations],
  ) as ConversationSummary[];
};
