"use client";

import * as React from "react";

import { useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { useConvexAuth } from "convex/react";

export type TraderLaunchpadDataMode = "demo" | "live";

export type TraderLaunchpadDataModeState = {
  isSignedIn: boolean;
  isAdmin: boolean;
  brokerConnected: boolean;
  dataMode: TraderLaunchpadDataMode;
  effectiveMode: TraderLaunchpadDataMode;
  setDataMode: (mode: TraderLaunchpadDataMode) => Promise<void>;
};

const DataModeContext = React.createContext<TraderLaunchpadDataModeState | null>(
  null,
);

const normalizeDataMode = (value: unknown): TraderLaunchpadDataMode => {
  return value === "demo" || value === "live" ? value : "live";
};

export function DataModeProvider(props: { children: React.ReactNode }) {
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

  const viewerSettings = useQuery(
    api.viewer.queries.getViewerSettings,
    shouldQuery ? {} : "skip",
  ) as
    | { isSignedIn: boolean; isAdmin: boolean; dataMode: TraderLaunchpadDataMode }
    | undefined;

  const connectionData = useQuery(
    api.traderlaunchpad.queries.getMyTradeLockerConnection,
    shouldQuery && canUseJournal ? {} : "skip",
  ) as unknown;

  const setDataModeMutation = useMutation(api.viewer.mutations.setDataMode);

  const brokerConnected = React.useMemo(() => {
    // getMyTradeLockerConnection returns null or { connection, accounts, polling }
    if (!connectionData || typeof connectionData !== "object") return false;
    const record = connectionData as Record<string, unknown>;
    const conn = record.connection;
    if (!conn || typeof conn !== "object") return false;
    const status = (conn as Record<string, unknown>).status;
    return status === "connected";
  }, [connectionData]);

  const isSignedIn = Boolean(viewerSettings?.isSignedIn);
  const isAdmin = Boolean(viewerSettings?.isAdmin);
  const dataMode = normalizeDataMode(viewerSettings?.dataMode);

  // "Effective" is the user-selected mode. Pages/components can also consult
  // `brokerConnected` to decide whether to show empty states vs demo fallbacks.
  const effectiveMode: TraderLaunchpadDataMode = dataMode;

  const setDataMode = React.useCallback(
    async (mode: TraderLaunchpadDataMode) => {
      await setDataModeMutation({ dataMode: mode });
    },
    [setDataModeMutation],
  );

  const value: TraderLaunchpadDataModeState = React.useMemo(
    () => ({
      isSignedIn,
      isAdmin,
      brokerConnected,
      dataMode,
      effectiveMode,
      setDataMode,
    }),
    [brokerConnected, dataMode, effectiveMode, isAdmin, isSignedIn, setDataMode],
  );

  return (
    <DataModeContext.Provider value={value}>
      {props.children}
    </DataModeContext.Provider>
  );
}

export function useDataMode(): TraderLaunchpadDataModeState {
  const ctx = React.useContext(DataModeContext);
  if (!ctx) {
    throw new Error("useDataMode must be used within DataModeProvider");
  }
  return ctx;
}

