"use client";

import type { GenericId as Id } from "convex/values";
import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import type { ContactDoc } from "../components/ConversationInspector";

export const useSupportContact = (contactId?: Id<"contacts">) => {
  const contactsApi = api as any;
  const contact = useQuery(
    contactsApi.core.contacts.queries.get,
    contactId ? { contactId } : "skip",
  ) as ContactDoc | null | undefined;

  return useMemo(() => contact ?? null, [contact]);
};
