"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { AppSidebar } from "@acme/ui/layout/AppSidebar";
import { ScrollArea } from "@acme/ui/scroll-area";
import { SidebarInset } from "@acme/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";
import {
  TaskSidebarProvider,
  TaskSidebarTrigger,
} from "@acme/ui/tasks-sidebar";

import { Separator } from "~/components/ui/separator";
import { TasksSidebar } from "./_components/TaskSidebar";

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
  const board = useQuery(
    api.tasks.boards.getBoard,
    boardId ? { boardId: boardId as Id<"taskBoards"> } : "skip",
  );

  // Determine active tab from pathname
  let tabValue: string = "tasks";
  if (pathname.endsWith("/kaban")) tabValue = "boards";
  else if (pathname.endsWith("/calendar")) tabValue = "calendar";
  else tabValue = "tasks";

  const handleTabChange = (value: string) => {
    let url: string;
    if (boardId) {
      url = `/admin/tasks/board/${boardId}`;
      if (value === "boards") url += "/kaban";
      else if (value === "calendar") url += "/calendar";
    } else {
      url = `/admin/tasks`;
      if (value === "boards") url += "/kaban";
      else if (value === "calendar") url += "/calendar";
    }
    router.push(url);
  };

  return (
    <div>
      <header>
        <Card className="w-full items-center shadow-none">
          <CardHeader className="flex flex-row items-center justify-between p-3">
            <CardTitle className="text-xl font-bold">
              {board?.name ?? "All Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-16 flex-row items-center gap-2 p-2">
            <Tabs value={tabValue} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="tasks">Main</TabsTrigger>
                <TabsTrigger value="boards">Kaban</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      </header>

      {children}
    </div>
  );
}
