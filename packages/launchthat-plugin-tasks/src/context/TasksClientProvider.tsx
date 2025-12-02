"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type ArgsOrSkip<Args> = Args | "skip";

type UseQueryHook = <Result = any, Args = any>(
  queryRef: unknown,
  args: ArgsOrSkip<Args>,
) => Result | undefined;

type UseMutationHook<Result = any, Args extends Array<any> = any[]> = (
  mutationRef: unknown,
) => (...mutationArgs: Args) => Promise<Result>;

export interface TasksClientContextValue {
  api: Record<string, unknown>;
  useQuery: UseQueryHook;
  useMutation: UseMutationHook;
}

const TasksClientContext = createContext<TasksClientContextValue | null>(null);

export function TasksProvider({
  value,
  children,
}: {
  value: TasksClientContextValue;
  children: ReactNode;
}) {
  return (
    <TasksClientContext.Provider value={value}>
      {children}
    </TasksClientContext.Provider>
  );
}

export function useTasksClient(): TasksClientContextValue {
  const ctx = useContext(TasksClientContext);
  if (!ctx) {
    throw new Error(
      "Tasks plugin components must be wrapped in TasksProvider with Convex hooks configured.",
    );
  }
  return ctx;
}

export function useTasksApi<T = any>(): T {
  const { api } = useTasksClient();
  return api as T;
}

export function useTasksQuery<Result = any, Args = any>(
  queryRef: unknown,
  args: ArgsOrSkip<Args>,
): Result | undefined {
  if (!queryRef || args === "skip") {
    return undefined;
  }

  const { useQuery } = useTasksClient();
  return useQuery<Result, Args>(queryRef, args);
}

export function useTasksMutation(mutationRef: unknown) {
  if (!mutationRef) {
    throw new Error("Tasks mutation reference is undefined.");
  }
  const { useMutation } = useTasksClient();
  return useMutation(mutationRef);
}
