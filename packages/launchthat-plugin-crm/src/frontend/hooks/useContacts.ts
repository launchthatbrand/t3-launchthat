"use client";

import { useQuery } from "convex/react";

import type { ContactRow } from "../types";

export type UseContactsArgs = {
  listContactsQuery: unknown;
  status?: string;
  limit?: number;
};

export const useContacts = ({ listContactsQuery, status, limit }: UseContactsArgs) => {
  return useQuery(listContactsQuery as any, {
    status: status || undefined,
    limit,
  }) as ContactRow[] | undefined;
};
