import type { TaskBoardId, TaskBoardRecord, TaskId, TaskRecord } from "../types";

import {
  useTasksApi,
  useTasksMutation,
  useTasksQuery,
} from "../context/TasksClientProvider";

export function getTaskQueries(api: any) {
  return api?.tasks?.queries ?? api?.tasks?.index ?? api?.tasks;
}

export function getTaskMutations(api: any) {
  return api?.tasks?.mutations ?? api?.tasks;
}

export function getBoardQueries(api: any) {
  const boards = api?.tasks?.boards;
  return boards?.queries ?? boards;
}

export function getBoardMutations(api: any) {
  const boards = api?.tasks?.boards;
  return boards?.mutations ?? boards;
}

export function useTasks() {
  const api = useTasksApi<any>();
  return useTasksQuery<TaskRecord[]>(getTaskQueries(api)?.listTasks, {});
}

export function useTask(taskId: TaskId | null) {
  const api = useTasksApi<any>();
  return useTasksQuery<TaskRecord | null>(
    getTaskQueries(api)?.getTask,
    taskId ? { taskId } : "skip",
  );
}

export function useTasksByBoard(boardId: TaskBoardId | null) {
  const api = useTasksApi<any>();
  return useTasksQuery<TaskRecord[]>(
    getTaskQueries(api)?.listTasksByBoard,
    boardId ? { boardId } : "skip",
  );
}

export const useCreateTask = () => {
  const api = useTasksApi<any>();
  return useTasksMutation(getTaskMutations(api)?.createTask);
};
export const useUpdateTask = () => {
  const api = useTasksApi<any>();
  return useTasksMutation(getTaskMutations(api)?.updateTask);
};
export const useDeleteTask = () => {
  const api = useTasksApi<any>();
  return useTasksMutation(getTaskMutations(api)?.deleteTask);
};

// Add a hook for reordering tasks
export const useReorderTasks = () => {
  const api = useTasksApi<any>();
  return useTasksMutation(getTaskMutations(api)?.reorderTasks);
};

export function useTaskBoards() {
  const api = useTasksApi<any>();
  return useTasksQuery<TaskBoardRecord[]>(getBoardQueries(api)?.listBoards, {});
}
