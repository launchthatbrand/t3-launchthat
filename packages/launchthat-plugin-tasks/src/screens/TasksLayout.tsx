"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

const getBoardIdFromPath = (pathname: string) => {
  // Matches /admin/tasks/board/[boardId] and subroutes
  const match = pathname.match(/\/admin\/tasks\/board\/([^\/]+)/);
  return match ? match[1] : null;
};

export default function TasksLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const boardId = getBoardIdFromPath(pathname);

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
          <CardHeader className="flex w-full flex-row items-center justify-between p-3">
            <CardTitle className="text-xl font-bold">
              {boardId ? "Board" : "All Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-16 w-full flex-row items-center gap-2 p-2">
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
