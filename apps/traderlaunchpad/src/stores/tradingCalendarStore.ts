"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TradingCalendarState {
  selectedDate: string | null;
  setSelectedDate: (value: string | null) => void;
}

export const useTradingCalendarStore = create<TradingCalendarState>()(
  persist(
    (set) => ({
      selectedDate: null,
      setSelectedDate: (value) => set({ selectedDate: value }),
    }),
    {
      name: "traderlaunchpad-calendar-selection",
    },
  ),
);
