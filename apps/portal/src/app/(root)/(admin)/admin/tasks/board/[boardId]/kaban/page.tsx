"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import React from "react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

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

const STATUS_COLUMNS = [
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function KanbanPage() {
  const { boardId } = useParams();
  // Fetch all tasks
  const tasks = useQuery(api.tasks.index.listTasksByBoard, {
    boardId: boardId as Id<"taskBoards">,
  });
  const updateTask = useMutation(api.tasks.index.updateTask);

  // Group tasks by status
  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<string, Doc<"tasks">[]> = {};
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
        const task = JSON.parse(taskData) as Doc<"tasks">;
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
                    <KanbanBoardCard data={task}>
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
