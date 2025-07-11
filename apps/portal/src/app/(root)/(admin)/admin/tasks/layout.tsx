"use client";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";
import {
  TaskSidebarProvider,
  TaskSidebarTrigger,
} from "@acme/ui/tasks-sidebar";
import { usePathname, useRouter } from "next/navigation";

import { AppSidebar } from "@acme/ui/layout/AppSidebar";
import Link from "next/link";
import React from "react";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { TasksSidebar } from "./_components/TaskSidebar";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

interface TasksLayoutProps {
  children: React.ReactNode;
}

const getBoardIdFromPath = (pathname: string) => {
  // Matches /admin/tasks/board/[boardId] and subroutes
  const match = pathname.match(/\/admin\/tasks\/board\/([^\/]+)/);
  return match ? match[1] : null;
};

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const boardId = getBoardIdFromPath(pathname);

  // Determine active tab from pathname
  let tabValue: string = "tasks";
  if (pathname.endsWith("/kaban")) tabValue = "boards";
  else if (pathname.endsWith("/calendar")) tabValue = "calendar";
  else tabValue = "tasks";

  const handleTabChange = (value: string) => {
    if (!boardId) return;
    let url = `/admin/tasks/board/${boardId}`;
    if (value === "boards") url += "/kaban";
    else if (value === "calendar") url += "/calendar";
    router.push(url);
  };

  return (
    <TaskSidebarProvider>
      <TasksSidebar variant="floating" collapsible="icon" />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <TaskSidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Tabs value={tabValue} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="tasks">Main</TabsTrigger>
              <TabsTrigger value="boards">Kaban</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>
        {children}
      </div>
    </TaskSidebarProvider>
  );
}
