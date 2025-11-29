"use client";

import type { GenericId as Id } from "convex/values";
import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import type { ContactDoc } from "../components/ConversationInspector";

export const useSupportContact = (contactId?: Id<"contacts">) => {
  const contact = useQuery(
    api.core.contacts.queries.get,
    contactId ? { contactId } : "skip",
  ) as ContactDoc | null | undefined;

  return useMemo(() => contact ?? null, [contact]);
};
