import type { Doc } from "@convex-config/_generated/dataModel";
import React from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import {
  TaskSidebar,
  TaskSidebarContent,
  TaskSidebarGroup,
  TaskSidebarHeader,
  TaskSidebarMenu,
  TaskSidebarMenuItem,
  TaskSidebarRail,
} from "@acme/ui/tasks-sidebar";

import { getBoardQueries } from "../api/tasks";
import { useTasksApi, useTasksQuery } from "../context/TasksClientProvider";
import BoardForm from "./BoardForm";

// Assume you have a Convex table 'taskBoards' with fields: _id, name
// and a query api.tasks.boards.listBoards

export function TasksSidebar(props: React.ComponentProps<typeof TaskSidebar>) {
  const tasksApi = useTasksApi<any>();
  const boardQueries = getBoardQueries(tasksApi);
  const boards = useTasksQuery<Doc<"taskBoards">[]>(
    boardQueries?.listBoards,
    {},
  );

  return (
    <TaskSidebar {...props}>
      <TaskSidebarHeader className="border-border flex flex-row justify-between border-b text-lg font-bold">
        Task Boards
        <Dialog>
          <DialogTrigger>
            <PlusIcon className="h-4 w-4" />
          </DialogTrigger>
          <DialogContent>
            <div className="space-y-4">
              <div>
                <DialogTitle>Create Task Board</DialogTitle>
                <DialogDescription>
                  Create a new task board to organize your tasks.
                </DialogDescription>
              </div>
              <BoardForm />
            </div>
          </DialogContent>
        </Dialog>
      </TaskSidebarHeader>
      <TaskSidebarContent>
        <TaskSidebarGroup>
          <TaskSidebarMenu>
            {(boards ?? []).map((board) => (
              <TaskSidebarMenuItem key={board._id}>
                <Link
                  href={`/admin/tasks/board/${board._id}`}
                  className="hover:bg-accent block w-full rounded px-2 py-1"
                >
                  {board.name}
                </Link>
              </TaskSidebarMenuItem>
            ))}
          </TaskSidebarMenu>
        </TaskSidebarGroup>
      </TaskSidebarContent>
      <TaskSidebarRail />
    </TaskSidebar>
  );
}
