import type { Doc } from "@/convex/_generated/dataModel";
import React from "react";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
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

import { DialogHeader } from "~/components/ui/dialog";
import BoardForm from "./BoardForm";

// Assume you have a Convex table 'taskBoards' with fields: _id, name
// and a query api.tasks.boards.listBoards

export function TasksSidebar(props: React.ComponentProps<typeof TaskSidebar>) {
  // Fetch all boards
  const boards: Doc<"taskBoards">[] | undefined = useQuery(
    api.tasks.boards.listBoards,
    {},
  );

  return (
    <TaskSidebar {...props}>
      <TaskSidebarHeader className="flex flex-row justify-between border-b border-border text-lg font-bold">
        Task Boards
        <Dialog>
          <DialogTrigger>
            <PlusIcon className="h-4 w-4" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task Board</DialogTitle>
              <DialogDescription>
                Create a new task board to organize your tasks.
              </DialogDescription>
              <BoardForm />
            </DialogHeader>
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
                  className="block w-full rounded px-2 py-1 hover:bg-accent"
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
