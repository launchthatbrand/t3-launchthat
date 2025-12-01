"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type ArgsOrSkip<Args> = Args | "skip";

export type UseQueryHook = <Result = unknown, Args = unknown>(
  queryRef: unknown,
  args: ArgsOrSkip<Args>,
) => Result | undefined;

export type UseMutationHook<
  Result = unknown,
  Args extends Array<unknown> = Array<unknown>,
> = (mutationRef: unknown) => (...mutationArgs: Args) => Promise<Result>;

export interface CommerceHooks {
  useQuery: UseQueryHook;
  useMutation: UseMutationHook;
  useAuth?: () => { userId?: string | null };
}

export interface CommerceClient {
  api: Record<string, unknown>;
  hooks: CommerceHooks;
}

const CommerceClientContext = createContext<CommerceClient | null>(null);

export interface CommerceProviderProps {
  value: CommerceClient;
  children: ReactNode;
}

export function CommerceProvider({ value, children }: CommerceProviderProps) {
  return (
    <CommerceClientContext.Provider value={value}>
      {children}
    </CommerceClientContext.Provider>
  );
}

export function useCommerceClient(): CommerceClient {
  const ctx = useContext(CommerceClientContext);
  if (!ctx) {
    throw new Error(
      "Commerce components must be wrapped by CommerceProvider with api/hooks configured.",
    );
  }
  return ctx;
}

export function useCommerceApi<T = any>(): T {
  const { api } = useCommerceClient();
  return api as T;
}

export function useCommerceQuery<Result = unknown, Args = unknown>(
  queryRef: unknown,
  args: ArgsOrSkip<Args>,
): Result | undefined {
  if (!queryRef || args === "skip") {
    return undefined;
  }

  const {
    hooks: { useQuery },
  } = useCommerceClient();

  return useQuery<Result, Args>(queryRef, args);
}

export function useCommerceMutation<
  Result = unknown,
  Args extends Array<unknown> = Array<unknown>,
>(mutationRef: unknown): (...mutationArgs: Args) => Promise<Result> {
  if (!mutationRef) {
    return async () => {
      throw new Error(
        "Missing mutation reference. Ensure CommerceProvider receives the api bindings.",
      );
    };
  }

  const {
    hooks: { useMutation },
  } = useCommerceClient();

  const mutation = useMutation(mutationRef);
  return mutation as (...mutationArgs: Args) => Promise<Result>;
}

export function useCommerceAuth() {
  const {
    hooks: { useAuth },
  } = useCommerceClient();

  const authState = useAuth?.();

  return {
    userId: authState?.userId ?? undefined,
    isAuthenticated: Boolean(authState?.userId),
  };
}
