"use client";

import * as React from "react";

import { env } from "~/env";
import { getAuthHostForHost, isAuthHostForHost } from "~/lib/host";

export interface HostContextValue {
  host: string;
  hostname: string;
  rootDomain: string;
  authHost: string;
  isAuthHost: boolean;
}

const HostContext = React.createContext<HostContextValue | null>(null);

export const HostProvider = ({
  host,
  children,
}: {
  host: string;
  children: React.ReactNode;
}) => {
  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const authHost = getAuthHostForHost(host, rootDomain);
  const hostname = (host.split(":")[0] ?? "").toLowerCase();
  const value = React.useMemo<HostContextValue>(() => {
    return {
      host,
      hostname,
      rootDomain,
      authHost,
      isAuthHost: isAuthHostForHost(host, rootDomain),
    };
  }, [authHost, host, hostname, rootDomain]);

  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
};

export const useHostContext = (): HostContextValue => {
  const ctx = React.useContext(HostContext);
  if (!ctx) {
    throw new Error("useHostContext must be used within HostProvider");
  }
  return ctx;
};
