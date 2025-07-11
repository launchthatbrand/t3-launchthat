"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import React, { use, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { Plus, Trash } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
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

import type { ColumnDefinition } from "~/components/shared/EntityList/EntityList";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useTasksByBoard,
  useUpdateTask,
} from "../../_api/tasks";
import { TaskForm, TaskFormValues } from "../../_components/TaskForm";

// Placeholder for DetachableFilters component
const DetachableFilters = ({ filters, activeFilters, onFilterChange }: any) =>
  null;

const handleSubmit = async (values: TaskFormValues) => {
  // Convert dueDate to number (timestamp) or undefined
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
  // Optionally refetch tasks here if not auto-updating
};

const columns: ColumnDefinition<Doc<"tasks">>[] = [
  {
    id: "title",
    header: "Title",
    accessorKey: "title",
    sortable: true,
    cell: (task) => <span className="font-medium">{task.title}</span>,
  },
  {
    id: "description",
    header: "Description",
    accessorKey: "description",
    cell: (task) => (
      <div className="max-w-xs truncate">{task.description ?? "N/A"}</div>
    ),
  },
  {
    id: "dueDate",
    header: "Due Date",
    accessorKey: "dueDate",
    sortable: true,
    cell: (task) =>
      task.dueDate ? (
        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
      ) : (
        <span className="text-muted-foreground">No date</span>
      ),
  },
  {
    id: "isRecurring",
    header: "Recurring",
    accessorKey: "isRecurring",
    cell: (task) =>
      task.isRecurring ? (
        <Badge variant="default">Yes</Badge>
      ) : (
        <Badge variant="secondary">No</Badge>
      ),
  },
  {
    id: "recurrenceRule",
    header: "Recurrence Rule",
    accessorKey: "recurrenceRule",
    cell: (task) =>
      task.recurrenceRule ?? <span className="text-muted-foreground">N/A</span>,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    sortable: true,
    cell: (task) => {
      let variant: "default" | "secondary" | "destructive" = "default";
      if (task.status === "completed") variant = "default";
      else if (task.status === "pending") variant = "secondary";
      else if (task.status === "cancelled") variant = "destructive";
      return <Badge variant={variant}>{task.status}</Badge>;
    },
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

  const tasks = useTasksByBoard(boardId as Id<"taskBoards">);
  const deleteTask = useDeleteTask();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editTask, setEditTask] = React.useState<Doc<"tasks"> | null>(null);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

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

  // --- Move handlers up so they're defined before use ---
  const handleCreateClick = () => {
    setEditTask(null);
    setDrawerOpen(true);
  };

  const handleEditClick = (task: Doc<"tasks">) => {
    console.log("[handleEditClick] task", task);
    setEditTask(task);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditTask(null);
  };
  const board = useQuery(api.tasks.boards.getBoard, {
    boardId: boardId as Id<"taskBoards">,
  });
  console.log("tasks", tasks);
  const [activeFilters, setActiveFilters] = useState({});
  const [open, setOpen] = useState(false);

  const handleFilterChange = (newFilters: any) => setActiveFilters(newFilters);

  const headerActions: any[] = [];

  if (!board) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading board...
      </div>
    );
  }

  return (
    <div className="container flex py-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <EntityList<Doc<"tasks">>
          data={tasks ?? []}
          columns={columns}
          filters={filters}
          hideFilters={true}
          initialFilters={activeFilters}
          onFiltersChange={handleFilterChange}
          isLoading={tasks === undefined}
          title={board.name}
          description={`Tasks for board: ${board.name}`}
          defaultViewMode="list"
          viewModes={["list"]}
          entityActions={entityActions}
          actions={headerActions}
          emptyState={
            <DialogTrigger asChild>
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <p className="text-muted-foreground">No tasks found</p>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  aria-label="Create your first task"
                >
                  <Plus className="h-4 w-4" /> Create your first task
                </Button>
              </div>
            </DialogTrigger>
          }
        />
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {editTask ? "Edit Task" : "Create Task"}
              </DrawerTitle>
              <DrawerClose onClick={handleDrawerClose} />
            </DrawerHeader>
            <div className="p-4">
              <TaskForm
                task={editTask}
                onSubmit={handleSubmit}
                // No isSubmitting prop, as Convex hooks do not provide isPending by default
                submitButtonText={editTask ? "Update Task" : "Create Task"}
              />
            </div>
          </DrawerContent>
        </Drawer>
        <DialogContent>
          <DialogTitle>Create Task</DialogTitle>
          <TaskForm
            boardId={boardId as Id<"taskBoards">}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoardPage;
