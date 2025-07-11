"use client";

import type {
  ColumnDefinition,
  FilterConfig,
  FilterValue,
} from "~/components/shared/EntityList/types";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@acme/ui/drawer";
import { Plus, Trash } from "lucide-react";
import { TaskForm, TaskFormValues } from "./_components/TaskForm";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from "./_api/tasks";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Calendar from "@acme/ui/calendar/components/calendar";
import type { CalendarEvent } from "@acme/ui/calendar/utils/data";
import { DetachableFilters } from "~/components/shared/EntityList/DetachableFilters";
import type { Doc } from "@/convex/_generated/dataModel";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { EventsProvider } from "@acme/ui/calendar/context/events-context";
import Link from "next/link";
import React from "react";

// Task row type
export default function AdminTasksPage() {
  const tasks = useTasks();
  const deleteTask = useDeleteTask();
  const [activeFilters, setActiveFilters] = React.useState<
    Record<string, FilterValue>
  >({});
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editTask, setEditTask] = React.useState<Doc<"tasks"> | null>(null);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  // --- Move handlers up so they're defined before use ---
  const handleCreateClick = () => {
    setEditTask(null);
    setDrawerOpen(true);
  };

  const handleEditClick = (task: Doc<"tasks">) => {
    setEditTask(task);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditTask(null);
  };

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

  // Columns for the tasks table
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
        task.recurrenceRule ?? (
          <span className="text-muted-foreground">N/A</span>
        ),
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

  // Filters for the tasks table
  const filters: FilterConfig<Doc<"tasks">>[] = [
    {
      id: "title",
      label: "Title",
      type: "text",
      field: "title",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      id: "dueDate",
      label: "Due Date",
      type: "date",
      field: "dueDate",
    },
    {
      id: "isRecurring",
      label: "Recurring",
      type: "boolean",
      field: "isRecurring",
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

  // Header action for creating a new task (placeholder)
  const headerActions = (
    <Button
      variant="primary"
      onClick={handleCreateClick}
      className="flex items-center gap-2"
      aria-label="Create your first task"
    >
      <Plus className="h-4 w-4" /> Create your first task
    </Button>
  );

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, FilterValue>) => {
    setActiveFilters(newFilters);
    // Optionally, refetch data with filters
  };

  // Map tasks with dueDate to calendar events
  const calendarEvents: CalendarEvent[] = React.useMemo(
    () =>
      (tasks ?? [])
        .filter((task) => typeof task.dueDate === "number" && !!task.dueDate)
        .map((task) => ({
          id: task._id,
          title: task.title,
          description: task.description ?? "",
          start: new Date(task.dueDate!),
          end: new Date(task.dueDate!), // single-day event
        })),
    [tasks],
  );

  const handleEventClick = (event: CalendarEvent) => {
    const found = (tasks ?? []).find((t) => t._id === event.id);
    if (found) {
      setEditTask(found);
      setDrawerOpen(true);
    }
  };

  return (
    // <div className="container py-6">
    //   <h1 className="mb-4 text-2xl font-bold">Tasks</h1>
    //   <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
    //     {/* Sidebar with filters */}
    //     <div className="md:col-span-1">
    //       <div className="sticky top-4">
    //         <DetachableFilters
    //           filters={filters}
    //           activeFilters={activeFilters}
    //           onFilterChange={handleFilterChange}
    //         />
    //       </div>
    //     </div>
    //     {/* Main content area */}
    //     <div className="md:col-span-3">
    //       <EntityList<Doc<"tasks">>
    //         data={tasks ?? []}
    //         columns={columns}
    //         filters={filters}
    //         hideFilters={true}
    //         initialFilters={activeFilters}
    //         onFiltersChange={handleFilterChange}
    //         isLoading={tasks === undefined}
    //         title="Task Management"
    //         description="Manage your admin tasks here."
    //         defaultViewMode="list"
    //         viewModes={["list"]}
    //         entityActions={entityActions}
    //         actions={headerActions}
    //         emptyState={
    //           <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
    //             <p className="text-muted-foreground">No tasks found</p>
    //             <Button
    //               variant="outline"
    //               onClick={handleCreateClick}
    //               className="flex items-center gap-2"
    //               aria-label="Create your first task"
    //             >
    //               <Plus className="h-4 w-4" /> Create your first task
    //             </Button>
    //           </div>
    //         }
    //       />
    //     </div>
    //   </div>
    //   <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
    //     <DrawerContent>
    //       <DrawerHeader>
    //         <DrawerTitle>{editTask ? "Edit Task" : "Create Task"}</DrawerTitle>
    //         <DrawerClose onClick={handleDrawerClose} />
    //       </DrawerHeader>
    //       <div className="p-4">
    //         <TaskForm
    //           initialData={editTask ?? undefined}
    //           onSubmit={handleSubmit}
    //           // No isSubmitting prop, as Convex hooks do not provide isPending by default
    //           submitButtonText={editTask ? "Update Task" : "Create Task"}
    //         />
    //       </div>
    //     </DrawerContent>
    //   </Drawer>
    //   {/* --- Calendar Section --- */}
    //   <div className="mt-10">
    //     <h2 className="mb-4 text-xl font-semibold">Task Calendar</h2>
    //     <EventsProvider>
    //       <Calendar
    //         externalEvents={calendarEvents}
    //         onEventClick={handleEventClick}
    //         defaultView="dayGridMonth"
    //         showAddEventButton={false}
    //       />
    //     </EventsProvider>
    //   </div>
    // </div>
    <div>Select a board to view tasks</div>
  );
}
