"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TradeLockerDebugTestId =
  | "config"
  | "state"
  | "positions"
  | "orders"
  | "ordersHistory"
  | "filledOrders"
  | "executions"
  | "userMe"
  | "userMeAccounts"
  | "reportTradesHistory"
  | "reportClosedPositionsHistory"
  | "reportBalanceHistory"
  | "reportOrderHistory"
  | "backendCloseTradesHistory"
  | "backendReportsDiscovery"
  | "history";

type StoredResult = {
  updatedAt: number;
  value: unknown;
};

interface TradeLockerApiDebugState {
  // Keyed by accountRowId, then test id.
  resultsByAccount: Record<string, Partial<Record<TradeLockerDebugTestId, StoredResult>>>;
  setResult: (args: {
    accountRowId: string;
    testId: TradeLockerDebugTestId;
    value: unknown;
  }) => void;
  clearAccount: (accountRowId: string) => void;
}

export const useTradeLockerApiDebugStore = create<TradeLockerApiDebugState>()(
  persist(
    (set) => ({
      resultsByAccount: {},
      setResult: ({ accountRowId, testId, value }) =>
        set((state) => ({
          resultsByAccount: {
            ...state.resultsByAccount,
            [accountRowId]: {
              ...(state.resultsByAccount[accountRowId] ?? {}),
              [testId]: { updatedAt: Date.now(), value },
            },
          },
        })),
      clearAccount: (accountRowId) =>
        set((state) => {
          const next = { ...state.resultsByAccount };
          delete next[accountRowId];
          return { resultsByAccount: next };
        }),
    }),
    {
      name: "traderlaunchpad-tradelocker-api-debug",
    },
  ),
);

