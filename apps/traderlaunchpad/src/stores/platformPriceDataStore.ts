"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlatformPriceDataTab = "chart" | "jobs" | "compare";
export type PlatformPriceDataLookbackDays = 1 | 3 | 7 | 14 | 30 | 60 | 90;
export type PlatformPriceDataChartLookbackDays = 1 | 3 | 7 | 14;
export type PlatformPriceDataResolution =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d";

interface PlatformPriceDataState {
  tab: PlatformPriceDataTab;
  setTab: (value: PlatformPriceDataTab) => void;

  sourceKey: string;
  setSourceKey: (value: string) => void;

  pairSearch: string;
  setPairSearch: (value: string) => void;

  tradableInstrumentId: string;
  symbol: string;
  setInstrument: (args: { tradableInstrumentId: string; symbol: string }) => void;
  clearInstrument: () => void;

  lookback: PlatformPriceDataLookbackDays;
  setLookback: (value: PlatformPriceDataLookbackDays) => void;

  overlapDays: string;
  setOverlapDays: (value: string) => void;

  chartLookback: PlatformPriceDataChartLookbackDays;
  setChartLookback: (value: PlatformPriceDataChartLookbackDays) => void;

  resolution: PlatformPriceDataResolution;
  setResolution: (value: PlatformPriceDataResolution) => void;
}

export const usePlatformPriceDataStore = create<PlatformPriceDataState>()(
  persist(
    (set) => ({
      tab: "chart",
      setTab: (value) => set({ tab: value }),

      sourceKey: "",
      setSourceKey: (value) =>
        set(() => ({
          sourceKey: value,
          // switching brokers should reset instrument selection
          tradableInstrumentId: "",
          symbol: "",
          pairSearch: "",
        })),

      pairSearch: "",
      setPairSearch: (value) => set({ pairSearch: value }),

      tradableInstrumentId: "",
      symbol: "",
      setInstrument: ({ tradableInstrumentId, symbol }) =>
        set({
          tradableInstrumentId,
          symbol,
        }),
      clearInstrument: () => set({ tradableInstrumentId: "", symbol: "" }),

      lookback: 7,
      setLookback: (value) => set({ lookback: value }),

      overlapDays: "1",
      setOverlapDays: (value) => set({ overlapDays: value }),

      chartLookback: 1,
      setChartLookback: (value) => set({ chartLookback: value }),

      resolution: "1m",
      setResolution: (value) => set({ resolution: value }),
    }),
    {
      name: "traderlaunchpad-platform-price-data",
    },
  ),
);

