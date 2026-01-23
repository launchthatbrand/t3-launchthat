"use client";

import type { TenantSummary } from "~/lib/tenant-fetcher";
import { createContext, useContext } from "react";

const TenantContext = createContext<TenantSummary | null>(null);

export function TenantProvider({
  value,
  children,
}: {
  value: TenantSummary | null;
  children: React.ReactNode;
}) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantSummary | null {
  return useContext(TenantContext);
}

