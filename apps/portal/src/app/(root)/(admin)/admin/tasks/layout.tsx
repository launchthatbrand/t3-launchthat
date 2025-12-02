"use client";

import type { ReactNode } from "react";
import { TasksLayout as TasksPluginLayout } from "launchthat-plugin-tasks/screens";

import { PortalTasksProvider } from "~/providers/TasksProvider";

export default function TasksLayout({ children }: { children: ReactNode }) {
  return (
    <PortalTasksProvider>
      <TasksPluginLayout>{children}</TasksPluginLayout>
    </PortalTasksProvider>
  );
}
