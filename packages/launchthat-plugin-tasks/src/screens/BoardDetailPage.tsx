"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@acme/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@acme/ui/drawer";

import {
  useCreateTask,
  useDeleteTask,
  useTasksByBoard,
  useUpdateTask,
} from "../api/tasks";
import { TaskForm, TaskFormValues } from "../components/TaskForm";
import { TasksTable } from "../components/TasksTable";
import { fieldRegistry } from "../fields/registry";

const BoardPage = () => {
  const { boardId } = useParams();
  const tasks = useTasksByBoard(boardId as Id<"taskBoards">);
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTask, setEditTask] = useState<Doc<"tasks"> | null>(null);
  const [open, setOpen] = useState(false);

  const handleEditClick = (task: Doc<"tasks">) => {
    setEditTask(task);
    setDrawerOpen(true);
  };

  const handleDelete = async (task: Doc<"tasks">) => {
    if (confirm(`Delete task: ${task.title}?`)) {
      await deleteTask({ taskId: task._id });
    }
  };

  // Move columns array here so it can access the handlers
  const columns: ColumnDef<Doc<"tasks">>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const TextField = fieldRegistry.text;
        return (
          <TextField
            value={row.original.title}
            onSave={(newTitle) =>
              updateTask({ taskId: row.original._id, title: newTitle })
            }
            className="font-medium"
          />
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.original.description ?? "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) =>
        row.original.dueDate ? (
          <span>{new Date(row.original.dueDate).toLocaleDateString()}</span>
        ) : (
          <span className="text-muted-foreground">No date</span>
        ),
    },
    {
      accessorKey: "isRecurring",
      header: "Recurring",
      cell: ({ row }) =>
        row.original.isRecurring ? (
          <Badge variant="default">Yes</Badge>
        ) : (
          <Badge variant="secondary">No</Badge>
        ),
    },
    {
      accessorKey: "recurrenceRule",
      header: "Recurrence Rule",
      cell: ({ row }) =>
        row.original.recurrenceRule ?? (
          <span className="text-muted-foreground">N/A</span>
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        let variant: "default" | "secondary" | "destructive" = "default";
        if (row.original.status === "completed") variant = "default";
        else if (row.original.status === "pending") variant = "secondary";
        else if (row.original.status === "cancelled") variant = "destructive";
        return <Badge variant={variant}>{row.original.status}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEditClick(row.original)}
          >
            <Plus className="mr-1 h-4 w-4" /> Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(row.original)}
          >
            <Trash className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return (
    <div className="container flex py-4">
      <TasksTable
        tasks={tasks ?? []}
        columns={columns}
        onAddTask={() => {
          setEditTask(null);
          setDrawerOpen(true);
        }}
      />
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editTask ? "Edit Task" : "Create Task"}</DrawerTitle>
            <DrawerClose onClick={() => setDrawerOpen(false)} />
          </DrawerHeader>
          <div className="p-4">
            <TaskForm
              task={editTask ?? undefined}
              boardId={boardId as Id<"taskBoards">}
              onSuccess={() => setDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default BoardPage;
