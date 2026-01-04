export type TaskId = string;
export type TaskBoardId = string;

export type TaskStatus = "pending" | "completed" | "cancelled";

export type TaskRecord = {
  _id: TaskId;
  _creationTime: number;
  title: string;
  description?: string;
  dueDate?: number;
  isRecurring?: boolean;
  recurrenceRule?: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  boardId?: TaskBoardId;
  sortIndex?: number;
};

export type TaskBoardRecord = {
  _id: TaskBoardId;
  _creationTime: number;
  name: string;
  createdAt: number;
  updatedAt: number;
};



