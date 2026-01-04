"use client";

import type { ColumnDef } from "@tanstack/react-table";
import React, { useCallback, useMemo, useState } from "react";
import { Plus, Trash } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@acme/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@acme/ui/drawer";

import { useDeleteTask, useTasks } from "../api/tasks";
import { TaskForm } from "../components/TaskForm";
import { TasksTable } from "../components/TasksTable";
import type { TaskRecord } from "../types";

const TasksPage = () => {
  const tasks = useTasks();
  const deleteTask = useDeleteTask();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskRecord | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setEditTask(null);
  }, []);

  const handleEditClick = useCallback((task: TaskRecord) => {
    setEditTask(task);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (task: TaskRecord) => {
      if (confirm(`Delete task: ${task.title}?`)) {
        await deleteTask({ taskId: task._id });
      }
    },
    [deleteTask],
  );

  const columns = useMemo<ColumnDef<TaskRecord>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
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
    ],
    [handleDelete, handleEditClick],
  );

  return (
    <div className="container flex py-4">
      <TasksTable
        tasks={tasks ?? []}
        columns={columns}
        onAddTask={() => setCreateDialogOpen(true)}
      />
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogTitle>Create Task</DialogTitle>
          <TaskForm onSuccess={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editTask ? "Edit Task" : "Create Task"}</DrawerTitle>
            <DrawerClose onClick={handleDrawerClose} />
          </DrawerHeader>
          <div className="p-4">
            <TaskForm
              task={editTask ?? undefined}
              onSuccess={handleDrawerClose}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default TasksPage;
