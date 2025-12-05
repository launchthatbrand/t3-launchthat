"use client";

import type { ContactDoc } from "../components/ConversationInspector";
import type { GenericId as Id } from "convex/values";
import { api } from "@portal/convexspec";
import { useMemo } from "react";
import { useQuery } from "convex/react";

export const useSupportContact = (contactId?: Id<"contacts">) => {
  const contact = useQuery(
    api.core.crm.contacts.queries.get,
    contactId ? { contactId } : "skip",
  ) as ContactDoc | null | undefined;

  return useMemo(() => contact ?? null, [contact]);
};
