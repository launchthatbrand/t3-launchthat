"use client";

import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";

type StoreRouteContextValue = {
  segments: string[];
  searchParams?: Record<string, string | string[] | undefined>;
};

const StoreRouteContext = createContext<StoreRouteContextValue>({
  segments: [],
  searchParams: {},
});

interface StoreRouteProviderProps extends PropsWithChildren {
  segments?: string[];
  searchParams?: Record<string, string | string[] | undefined>;
}

export const StoreRouteProvider = ({
  segments = [],
  searchParams,
  children,
}: StoreRouteProviderProps) => (
  <StoreRouteContext.Provider value={{ segments, searchParams }}>
    {children}
  </StoreRouteContext.Provider>
);

export const useStoreRouteSegments = () => {
  const ctx = useContext(StoreRouteContext);
  return ctx.segments;
};

export const useStoreRouteSearchParams = () => {
  const ctx = useContext(StoreRouteContext);
  return ctx.searchParams ?? {};
};
