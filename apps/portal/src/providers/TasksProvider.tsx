"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { TasksProvider } from "launchthat-plugin-tasks/context/TasksClientProvider";

export function PortalTasksProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      api,
      useQuery,
      useMutation,
    }),
    [],
  );

  return <TasksProvider value={value}>{children}</TasksProvider>;
}
