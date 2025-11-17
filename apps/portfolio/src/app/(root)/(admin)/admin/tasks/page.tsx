"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import React, { use, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { Plus, Trash } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@acme/ui/drawer";

import type { TaskFormValues } from "./_components/TaskForm";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useTasksByBoard,
  useUpdateTask,
} from "./_api/tasks";
import { TaskForm } from "./_components/TaskForm";
import { TasksTable } from "./_components/TasksTable";

// Placeholder for DetachableFilters component
const DetachableFilters = ({ filters, activeFilters, onFilterChange }: any) =>
  null;

const columns: ColumnDef<Doc<"tasks">, any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
];

// Entity actions for each row
const entityActions = [
  {
    id: "edit",
    label: "Edit",
    onClick: (task: Doc<"tasks">) => {
      handleEditClick(task);
    },
    variant: "secondary" as const,
    icon: <Plus className="mr-2 h-4 w-4" />,
  },
  {
    id: "delete",
    label: "Delete",
    onClick: async (task: Doc<"tasks">) => {
      if (confirm(`Delete task: ${task.title}?`)) {
        await deleteTask({ taskId: task._id });
      }
    },
    variant: "destructive" as const,
    icon: <Trash className="mr-2 h-4 w-4" />,
  },
];

const filters = [
  {
    key: "status",
    label: "Status",
    options: ["pending", "completed", "cancelled"],
  },
];

const BoardPage = ({ params }: { params: Promise<{ boardId: string }> }) => {
  const { boardId } = use(params);

  const tasks = useTasks();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editTask, setEditTask] = React.useState<Doc<"tasks"> | null>(null);
  const [open, setOpen] = React.useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditTask(null);
  };

  const handleEditClick = (task: Doc<"tasks">) => {
    setEditTask(task);
    setDrawerOpen(true);
  };

  const handleDelete = async (task: Doc<"tasks">) => {
    if (confirm(`Delete task: ${task.title}?`)) {
      await deleteTask({ taskId: task._id });
    }
  };

  const handleSubmit = async (values: TaskFormValues) => {
    const dueDate =
      values.dueDate instanceof Date ? values.dueDate.getTime() : undefined;
    if (editTask) {
      await updateTask({
        ...values,
        dueDate,
        taskId: editTask._id,
      });
    } else {
      await createTask({
        ...values,
        dueDate,
      });
    }
    handleDrawerClose();
  };

  return (
    <div className="container flex py-4">
      <TasksTable
        tasks={tasks ?? []}
        columns={columns}
        onAddTask={() => setOpen(true)}
        boardId={boardId}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Create Task</DialogTitle>
          <TaskForm
            boardId={boardId as Id<"taskBoards">}
            onSuccess={() => setOpen(false)}
          />
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
              boardId={boardId as Id<"taskBoards">}
              onSuccess={handleDrawerClose}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default BoardPage;
