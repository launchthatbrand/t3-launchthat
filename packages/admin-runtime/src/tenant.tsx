import { createContext, useContext } from "react";

import type { ReactNode } from "react";

export type TenantInfo = {
  tenantId?: string | null;
  organizationId?: string | null;
  slug?: string | null;
};

const TenantContext = createContext<TenantInfo>({});

export function TenantProvider({
  value,
  children,
}: {
  value: TenantInfo;
  children: ReactNode;
}) {
  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantInfo {
  return useContext(TenantContext);
}

export function getTenantOrganizationId(
  tenant?: TenantInfo | null,
): string | undefined {
  return tenant?.organizationId ?? undefined;
}
