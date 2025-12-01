"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type ArgsOrSkip<Args> = Args | "skip";

export type UseQueryHook = <Result = any, Args = any>(
  queryRef: unknown,
  args: ArgsOrSkip<Args>,
) => Result | undefined;

export type UseMutationHook = <Result = any, Args extends Array<any> = any[]>(
  mutationRef: unknown,
) => (...mutationArgs: Args) => Promise<Result>;

export interface SocialFeedHooks {
  useQuery: UseQueryHook;
  useMutation: UseMutationHook;
  useAuth?: () => { userId?: string | null };
  useConvexAuth?: () => { isAuthenticated: boolean };
}

export interface SocialFeedClient {
  api: Record<string, unknown>;
  hooks: SocialFeedHooks;
}

const SocialFeedClientContext = createContext<SocialFeedClient | null>(null);

export interface SocialFeedProviderProps {
  value: SocialFeedClient;
  children: ReactNode;
}

export function SocialFeedProvider({
  value,
  children,
}: SocialFeedProviderProps) {
  return (
    <SocialFeedClientContext.Provider value={value}>
      {children}
    </SocialFeedClientContext.Provider>
  );
}

export function useSocialFeedClient(): SocialFeedClient {
  const ctx = useContext(SocialFeedClientContext);
  if (!ctx) {
    throw new Error(
      "Social Feed components must be wrapped by SocialFeedProvider with api/hooks configured.",
    );
  }
  return ctx;
}

export function useSocialFeedApi<T = any>(): T {
  const { api } = useSocialFeedClient();
  const socialfeed = (api as any)?.plugins?.socialfeed;

  if (!socialfeed) {
    throw new Error(
      "Social Feed API references are missing. Ensure the provider receives api.plugins.socialfeed.",
    );
  }

  return socialfeed as T;
}

export function useSocialFeedQuery<Result = any, Args = any>(
  queryRef: unknown,
  args: ArgsOrSkip<Args>,
): Result | undefined {
  if (!queryRef || args === "skip") {
    return undefined;
  }
  const {
    hooks: { useQuery },
  } = useSocialFeedClient();
  return useQuery<Result, Args>(queryRef, args);
}

export function useSocialFeedMutation<
  Result = any,
  Args extends Array<any> = any[],
>(mutationRef: unknown): (...mutationArgs: Args) => Promise<Result> {
  const {
    hooks: { useMutation },
  } = useSocialFeedClient();

  if (!mutationRef) {
    return async () => {
      throw new Error(
        "Missing mutation reference. Ensure the SocialFeedProvider receives the proper api object.",
      );
    };
  }

  return useMutation<Result, Args>(mutationRef);
}

export function useSocialFeedAuth() {
  const {
    hooks: { useAuth, useConvexAuth },
  } = useSocialFeedClient();

  const authState = useAuth?.();
  const convexAuthState = useConvexAuth?.();

  return {
    userId: authState?.userId ?? undefined,
    isAuthenticated:
      convexAuthState?.isAuthenticated ?? Boolean(authState?.userId),
  };
}
