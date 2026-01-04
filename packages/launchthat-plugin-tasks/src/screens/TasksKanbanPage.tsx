"use client";

import React from "react";

import {
  KanbanBoard,
  KanbanBoardCard,
  KanbanBoardCardDescription,
  KanbanBoardCardTitle,
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnList,
  KanbanBoardColumnTitle,
  KanbanBoardProvider,
} from "@acme/ui/kanban";

import { getTaskMutations, useTasks } from "../api/tasks";
import { useTasksApi, useTasksMutation } from "../context/TasksClientProvider";
import type { TaskRecord } from "../types";

const STATUS_COLUMNS = [
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function KanbanPage() {
  const tasks = useTasks();
  const tasksApi = useTasksApi<any>();
  const taskMutations = getTaskMutations(tasksApi);
  if (!taskMutations?.updateTask) {
    throw new Error("Tasks API is missing task update mutation.");
  }
  const updateTask = useTasksMutation(taskMutations.updateTask);

  // Group tasks by status
  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<string, TaskRecord[]> = {};
    for (const { id } of STATUS_COLUMNS) grouped[id] = [];
    (tasks ?? []).forEach((task) => {
      const status = task.status || "pending";
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(task);
    });
    return grouped;
  }, [tasks]);

  // Handle drop: move task to new status
  const handleDrop = React.useCallback(
    async (taskData: string, newStatus: string) => {
      try {
        const task = JSON.parse(taskData) as TaskRecord;
        if (task.status !== newStatus) {
          await updateTask({ taskId: task._id, status: newStatus });
        }
      } catch (e) {
        // ignore
      }
    },
    [updateTask],
  );

  return (
    <div className="container py-4">
      <h1 className="mb-6 text-2xl font-bold">Task Kanban Board</h1>
      <KanbanBoardProvider>
        <KanbanBoard>
          {STATUS_COLUMNS.map((col) => (
            <KanbanBoardColumn
              key={col.id}
              columnId={col.id}
              onDropOverColumn={(data) => handleDrop(data, col.id)}
              className="min-h-[400px]"
            >
              <KanbanBoardColumnHeader>
                <KanbanBoardColumnTitle columnId={col.id}>
                  {col.label}
                </KanbanBoardColumnTitle>
              </KanbanBoardColumnHeader>
              <KanbanBoardColumnList>
                {(tasksByStatus[col.id] || []).map((task) => (
                  <li key={task._id} className="mb-2">
                    <KanbanBoardCard data={{ ...task, id: task._id as string }}>
                      <KanbanBoardCardTitle>{task.title}</KanbanBoardCardTitle>
                      {task.description && (
                        <KanbanBoardCardDescription>
                          {task.description}
                        </KanbanBoardCardDescription>
                      )}
                    </KanbanBoardCard>
                  </li>
                ))}
              </KanbanBoardColumnList>
            </KanbanBoardColumn>
          ))}
        </KanbanBoard>
      </KanbanBoardProvider>
    </div>
  );
}
