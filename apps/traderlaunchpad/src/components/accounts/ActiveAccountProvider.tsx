"use client";

import * as React from "react";

import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { useDataMode } from "~/components/dataMode/DataModeProvider";

export type BrokerProviderId = "tradelocker";

export type ActiveAccountOption = {
  provider: BrokerProviderId;
  accountRowId: string;
  accountId: string;
  label: string;
  meta?: {
    currency?: string;
    status?: string;
    name?: string;
    accNum?: number;
  };
};

export type ActiveAccountState = {
  isLive: boolean;
  options: ActiveAccountOption[];
  selected: ActiveAccountOption | null;
  setSelectedAccountRowId: (accountRowId: string) => Promise<void>;
};

const ActiveAccountContext = React.createContext<ActiveAccountState | null>(null);

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;

const toStringSafe = (v: unknown): string => (typeof v === "string" ? v : "");
const toNumberSafe = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

export function ActiveAccountProvider(props: { children: React.ReactNode }) {
  const dataMode = useDataMode();
  const isLive = dataMode.effectiveMode === "live";
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading && isLive;

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

  // Today this returns the TradeLocker connection + its connectionAccount rows.
  const connectionBundle = useQuery(
    api.traderlaunchpad.queries.getMyTradeLockerConnection,
    shouldQuery && canUseJournal ? {} : "skip",
  ) as unknown;

  const setSelectedAccount = useMutation(
    api.traderlaunchpad.mutations.setMySelectedConnectionAccount,
  );

  const { options, selected } = React.useMemo(() => {
    const empty = { options: [] as ActiveAccountOption[], selected: null as ActiveAccountOption | null };
    if (!connectionBundle || !isRecord(connectionBundle)) return empty;
    const connection = connectionBundle.connection;
    const accountsRaw = connectionBundle.accounts;
    const selectedAccountId =
      isRecord(connection) ? toStringSafe(connection.selectedAccountId) : "";

    const rows = Array.isArray(accountsRaw) ? accountsRaw : [];
    const opts: ActiveAccountOption[] = [];

    for (const row of rows) {
      if (!isRecord(row)) continue;
      const accountRowId = toStringSafe(row._id);
      const accountId = toStringSafe(row.accountId ?? row.id);
      if (!accountRowId || !accountId) continue;
      const name = toStringSafe(row.name);
      const currency = toStringSafe(row.currency);
      const status = toStringSafe(row.status);
      const accNum = toNumberSafe(row.accNum);

      const labelParts = [
        name || "Account",
        currency ? currency : null,
        status ? status : null,
        accountId ? `• ${accountId}` : null,
      ].filter(Boolean);

      opts.push({
        provider: "tradelocker",
        accountRowId,
        accountId,
        label: labelParts.join(" "),
        meta: {
          name: name || undefined,
          currency: currency || undefined,
          status: status || undefined,
          accNum,
        },
      });
    }

    const selectedOpt =
      (selectedAccountId
        ? opts.find((o) => o.accountId === selectedAccountId) ?? null
        : null) ?? (opts[0] ?? null);

    return { options: opts, selected: selectedOpt };
  }, [connectionBundle]);

  const setSelectedAccountRowId = React.useCallback(
    async (accountRowId: string) => {
      if (!accountRowId.trim()) return;
      await setSelectedAccount({ accountRowId });
    },
    [setSelectedAccount],
  );

  const value: ActiveAccountState = React.useMemo(
    () => ({
      isLive,
      options,
      selected,
      setSelectedAccountRowId,
    }),
    [isLive, options, selected, setSelectedAccountRowId],
  );

  return (
    <ActiveAccountContext.Provider value={value}>
      {props.children}
    </ActiveAccountContext.Provider>
  );
}

export function useActiveAccount(): ActiveAccountState {
  const ctx = React.useContext(ActiveAccountContext);
  if (!ctx) {
    throw new Error("useActiveAccount must be used within ActiveAccountProvider");
  }
  return ctx;
}

