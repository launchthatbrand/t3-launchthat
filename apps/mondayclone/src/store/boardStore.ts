import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import type { Board, Column, Folder, Group, Item } from "../types/board";
import { localPersistence } from "./persistence";

// UI State
interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

// Selection State
interface SelectionState {
  activeFolderId?: string;
  activeBoardId?: string;
  activeGroupId?: string;
  setActiveFolder: (id?: string) => void;
  setActiveBoard: (id?: string) => void;
  setActiveGroup: (id?: string) => void;
}

// Data State
interface DataState {
  folders: Record<string, Folder>;
  boards: Record<string, Board>;
  groups: Record<string, Group>;
  items: Record<string, Item>;
  columns: Record<string, Column>;
  // CRUD actions
  addFolder: (folder: Folder) => void;
  updateFolder: (folder: Folder) => void;
  removeFolder: (id: string) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (id: string) => void;
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  removeGroup: (id: string) => void;
  addItem: (item: Item) => void;
  updateItem: (item: Item) => void;
  removeItem: (id: string) => void;
  addColumn: (column: Column) => void;
  updateColumn: (column: Column) => void;
  removeColumn: (id: string) => void;
  hydrateFromPersistence: () => void;
}

export type BoardStore = UIState & SelectionState & DataState;

export const useBoardStore = create<BoardStore>()(
  persist(
    immer((set /*, get */) => ({
      // Removed unused 'get'
      // UI State
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) =>
        set((state: BoardStore) => {
          state.sidebarCollapsed = collapsed;
        }),
      // Selection State
      activeFolderId: undefined,
      activeBoardId: undefined,
      activeGroupId: undefined,
      setActiveFolder: (id) =>
        set((state: BoardStore) => {
          state.activeFolderId = id;
        }),
      setActiveBoard: (id) =>
        set((state: BoardStore) => {
          state.activeBoardId = id;
        }),
      setActiveGroup: (id) =>
        set((state: BoardStore) => {
          state.activeGroupId = id;
        }),
      // Data State
      folders: {},
      boards: {},
      groups: {},
      items: {},
      columns: {},
      // Folder CRUD
      addFolder: (folder) =>
        set((state: BoardStore) => {
          state.folders[folder.id] = folder;
        }),
      updateFolder: (folder) =>
        set((state: BoardStore) => {
          state.folders[folder.id] = folder;
        }),
      removeFolder: (id) =>
        set((state: BoardStore) => {
          delete state.folders[id];
          Object.values(state.boards).forEach((board) => {
            if (board.folderId === id) {
              board.folderId = undefined;
            }
          });
        }),
      // Board CRUD
      addBoard: (board) =>
        set((state: BoardStore) => {
          state.boards[board.id] = board;
        }),
      updateBoard: (board) =>
        set((state: BoardStore) => {
          state.boards[board.id] = board;
        }),
      removeBoard: (id) =>
        set((state: BoardStore) => {
          delete state.boards[id];
        }),
      // Group CRUD
      addGroup: (group) =>
        set((state: BoardStore) => {
          state.groups[group.id] = group;
        }),
      updateGroup: (group) =>
        set((state: BoardStore) => {
          state.groups[group.id] = group;
        }),
      removeGroup: (id) =>
        set((state: BoardStore) => {
          delete state.groups[id];
        }),
      // Item CRUD
      addItem: (item) =>
        set((state: BoardStore) => {
          state.items[item.id] = item;
        }),
      updateItem: (item) =>
        set((state: BoardStore) => {
          state.items[item.id] = item;
        }),
      removeItem: (id) =>
        set((state: BoardStore) => {
          delete state.items[id];
        }),
      // Column CRUD (in-memory only for now)
      addColumn: (column) =>
        set((state: BoardStore) => {
          state.columns[column.id] = column;
        }),
      updateColumn: (column) =>
        set((state: BoardStore) => {
          state.columns[column.id] = column;
        }),
      removeColumn: (id) =>
        set((state: BoardStore) => {
          delete state.columns[id];
        }),
      // Hydrate from persistence
      hydrateFromPersistence: () => {
        set((state: BoardStore) => {
          state.folders = Object.fromEntries(
            localPersistence.getAllFolders().map((f) => [f.id, f]),
          );
          state.boards = Object.fromEntries(
            localPersistence.getAllBoards().map((b) => [b.id, b]),
          );
          state.groups = Object.fromEntries(
            localPersistence.getAllGroups().map((g) => [g.id, g]),
          );
          state.items = Object.fromEntries(
            localPersistence.getAllItems().map((i) => [i.id, i]),
          );
        });
      },
    })),
    {
      name: "monclone-board-store",
      partialize: (state) => state, // persist all state for now
    },
  ),
);
