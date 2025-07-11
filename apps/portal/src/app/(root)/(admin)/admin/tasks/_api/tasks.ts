import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

export function useTasks() {
  return useQuery(api.tasks.index.listTasks, {});
}

export function useTask(taskId: Id<"tasks"> | null) {
  return useQuery(api.tasks.index.getTask, taskId ? { taskId } : "skip");
}

export function useTasksByBoard(boardId: Id<"taskBoards"> | null) {
  return useQuery(
    api.tasks.index.listTasksByBoard,
    boardId ? { boardId } : "skip",
  );
}

export const useCreateTask = () => useMutation(api.tasks.index.createTask);
export const useUpdateTask = () => useMutation(api.tasks.index.updateTask);
export const useDeleteTask = () => useMutation(api.tasks.index.deleteTask);
