"use client";

import type { GenericId as Id } from "convex/values";
import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import type { ContactDoc } from "../components/ConversationInspector";

export const useSupportContact = (contactId?: Id<"contacts">) => {
  // `@portal/convexspec` does not currently expose a first-class CRM contacts API.
  // Support ships its own bridge query; use a local `any` cast to avoid coupling this
  // package to convexspec generation quirks.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiAny = api as any;
  const contact = useQuery(
    apiAny.plugins.support.queries.getContactById,
    contactId ? { contactId } : "skip",
  ) as ContactDoc | null | undefined;

  return useMemo(() => contact ?? null, [contact]);
};
