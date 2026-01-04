/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as index from "../index.js";
import type * as tasks_boards_mutations from "../tasks/boards/mutations.js";
import type * as tasks_boards_queries from "../tasks/boards/queries.js";
import type * as tasks_mutations from "../tasks/mutations.js";
import type * as tasks_queries from "../tasks/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  index: typeof index;
  "tasks/boards/mutations": typeof tasks_boards_mutations;
  "tasks/boards/queries": typeof tasks_boards_queries;
  "tasks/mutations": typeof tasks_mutations;
  "tasks/queries": typeof tasks_queries;
}>;
export type Mounts = {
  tasks: {
    boards: {
      mutations: {
        createBoard: FunctionReference<
          "mutation",
          "public",
          { name: string },
          string
        >;
        deleteBoard: FunctionReference<
          "mutation",
          "public",
          { boardId: string },
          boolean
        >;
        updateBoard: FunctionReference<
          "mutation",
          "public",
          { boardId: string; name: string },
          boolean
        >;
      };
      queries: {
        getBoard: FunctionReference<
          "query",
          "public",
          { boardId: string },
          null | {
            _creationTime: number;
            _id: string;
            createdAt: number;
            name: string;
            updatedAt: number;
          }
        >;
        listBoards: FunctionReference<
          "query",
          "public",
          {},
          Array<{
            _creationTime: number;
            _id: string;
            createdAt: number;
            name: string;
            updatedAt: number;
          }>
        >;
      };
    };
    mutations: {
      createTask: FunctionReference<
        "mutation",
        "public",
        {
          boardId?: string;
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          status?: "pending" | "completed" | "cancelled";
          title: string;
        },
        string
      >;
      deleteTask: FunctionReference<
        "mutation",
        "public",
        { taskId: string },
        boolean
      >;
      reorderTasks: FunctionReference<
        "mutation",
        "public",
        { tasks: Array<{ sortIndex: number; taskId: string }> },
        boolean
      >;
      updateTask: FunctionReference<
        "mutation",
        "public",
        {
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          status?: "pending" | "completed" | "cancelled";
          taskId: string;
          title?: string;
        },
        boolean
      >;
    };
    queries: {
      getTask: FunctionReference<
        "query",
        "public",
        { taskId: string },
        null | {
          _creationTime: number;
          _id: string;
          boardId?: string;
          createdAt: number;
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          sortIndex?: number;
          status: "pending" | "completed" | "cancelled";
          title: string;
          updatedAt: number;
        }
      >;
      listTasks: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          boardId?: string;
          createdAt: number;
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          sortIndex?: number;
          status: "pending" | "completed" | "cancelled";
          title: string;
          updatedAt: number;
        }>
      >;
      listTasksByBoard: FunctionReference<
        "query",
        "public",
        { boardId: string },
        Array<{
          _creationTime: number;
          _id: string;
          boardId?: string;
          createdAt: number;
          description?: string;
          dueDate?: number;
          isRecurring?: boolean;
          recurrenceRule?: string;
          sortIndex?: number;
          status: "pending" | "completed" | "cancelled";
          title: string;
          updatedAt: number;
        }>
      >;
    };
  };
};
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
