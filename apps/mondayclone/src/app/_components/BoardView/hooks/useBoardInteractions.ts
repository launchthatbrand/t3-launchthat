"use client";

import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import type { Board, Column, Group, Item } from "../../../../types/board";
import { useBoardStore } from "../../../../store/boardStore";
import { ColumnType } from "../../../../types/board";
import {
  DEFAULT_DROPDOWN_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  GROUP_COLORS,
} from "../constants";

export const useBoardInteractions = (boardId: string | undefined) => {
  const {
    boards,
    groups,
    items,
    columns: storeColumns,
    updateBoard,
    updateGroup,
    updateItem,
    updateColumn,
    removeGroup,
    removeItem,
    addItem,
    addGroup,
    addColumn,
    removeColumn,
  } = useBoardStore(
    useShallow((s) => ({
      boards: s.boards,
      groups: s.groups,
      items: s.items,
      columns: s.columns,
      updateBoard: s.updateBoard,
      updateGroup: s.updateGroup,
      updateItem: s.updateItem,
      updateColumn: s.updateColumn,
      removeGroup: s.removeGroup,
      removeItem: s.removeItem,
      addItem: s.addItem,
      addGroup: s.addGroup,
      addColumn: s.addColumn,
      removeColumn: s.removeColumn,
    })),
  );

  const currentBoard: Board | undefined = boardId ? boards[boardId] : undefined;

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupColor, setEditGroupColor] = useState<string>(
    GROUP_COLORS[0]?.value ?? "blue",
  );
  const [showDeleteGroupId, setShowDeleteGroupId] = useState<string | null>(
    null,
  );

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemGroupId, setEditingItemGroupId] = useState<string | null>(
    null,
  );
  const [editItemValues, setEditItemValues] = useState<Record<string, unknown>>(
    {},
  );
  const [showDeleteItemId, setShowDeleteItemId] = useState<string | null>(null);

  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnName, setEditColumnName] = useState("");
  const [editColumnType, setEditColumnType] = useState<ColumnType>(
    ColumnType.Text,
  );
  const [showDeleteColumnId, setShowDeleteColumnId] = useState<string | null>(
    null,
  );

  const boardGroups: Group[] = currentBoard
    ? currentBoard.groups
        .map((gid: string) => groups[gid] as Group | undefined)
        .filter((g: Group | undefined): g is Group => Boolean(g))
    : [];

  const boardColumns: Column[] = currentBoard ? currentBoard.columns : [];

  // Group Handlers
  const handleAddGroup = (name: string, color: string) => {
    if (!currentBoard) return;
    const groupId = crypto.randomUUID();
    const defaultItemId = crypto.randomUUID();

    const defaultItemData: Record<string, unknown> = { name: "New Item" };
    boardColumns.forEach((col) => {
      defaultItemData[col.id] = "";
    });
    addItem({
      id: defaultItemId,
      groupId: groupId,
      ...defaultItemData,
    } as Item);

    addGroup({
      id: groupId,
      name: name,
      boardId: currentBoard.id,
      items: [defaultItemId],
      color: color,
    });

    const updatedBoard = {
      ...currentBoard,
      groups: [...currentBoard.groups, groupId],
    };
    updateBoard(updatedBoard);
  };

  const handleEditGroupStart = (group: Group) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
    setEditGroupColor(group.color);
  };

  const handleEditGroupSave = (group: Group) => {
    if (!editGroupName.trim()) return;
    updateGroup({ ...group, name: editGroupName, color: editGroupColor });
    setEditingGroupId(null);
  };

  const handleEditGroupCancel = () => {
    setEditingGroupId(null);
  };

  const handleDeleteGroupConfirm = (group: Group) => {
    if (!currentBoard) return;
    group.items.forEach((itemId) => removeItem(itemId));
    removeGroup(group.id);
    const updatedBoard = {
      ...currentBoard,
      groups: currentBoard.groups.filter((gid) => gid !== group.id),
    };
    updateBoard(updatedBoard);
    setShowDeleteGroupId(null);
  };

  // Item Handlers
  const handleAddItem = (group: Group) => {
    if (!currentBoard) return;
    const itemId = crypto.randomUUID();
    const currentCount = group.items.length;
    const nextItemNumber = currentCount + 1;
    const defaultName = `Item ${nextItemNumber}`;
    const newItemData: Record<string, unknown> = { name: defaultName };
    boardColumns.forEach((col) => {
      if (col.type === ColumnType.Checkbox) {
        newItemData[col.id] = false;
      } else {
        newItemData[col.id] = "";
      }
    });

    addItem({ id: itemId, groupId: group.id, ...newItemData } as Item);
    updateGroup({ ...group, items: [...group.items, itemId] });
    setEditingItemId(itemId);
    setEditingItemGroupId(group.id);
    setEditItemValues({ name: defaultName, ...newItemData });
  };

  const handleEditItemStart = (item: Item, groupId: string) => {
    setEditingItemId(item.id);
    setEditingItemGroupId(groupId);
    setEditItemValues({ ...item });
  };

  const handleEditItemSave = (item: Item) => {
    if (
      typeof editItemValues.name !== "string" ||
      !editItemValues.name.trim()
    ) {
      setEditItemValues({ ...item });
      if (!item.name.trim() && !editItemValues.name?.toString().trim()) {
        handleEditItemCancel();
        return;
      }
      if (!editItemValues.name?.toString().trim() && item.name.trim()) {
        updateItem({
          ...item,
          ...editItemValues,
          name: item.name,
        } as Item);
      } else {
        updateItem({ ...item, ...editItemValues } as Item);
      }
    } else {
      updateItem({ ...item, ...editItemValues } as Item);
    }
    setEditingItemId(null);
    setEditingItemGroupId(null);
    setEditItemValues({});
  };

  const handleEditItemCancel = () => {
    setEditingItemId(null);
    setEditingItemGroupId(null);
    setEditItemValues({});
  };

  const handleDeleteItemConfirm = (item: Item, group: Group) => {
    removeItem(item.id);
    updateGroup({
      ...group,
      items: group.items.filter((id) => id !== item.id),
    });
    setShowDeleteItemId(null);
  };

  const handleBulkDeleteItems = (itemIds: string[], group: Group) => {
    if (!itemIds.length) return;

    itemIds.forEach((itemId) => {
      removeItem(itemId);
    });

    updateGroup({
      ...group,
      items: group.items.filter((id) => !itemIds.includes(id)),
    });
  };

  // Column Handlers
  const handleAddColumn = (name: string, type: ColumnType) => {
    if (!currentBoard) return;
    const columnId = crypto.randomUUID();

    let columnConfig: Column["config"] = {};
    if (type === ColumnType.Status) {
      columnConfig = {
        type: ColumnType.Status,
        options: DEFAULT_STATUS_OPTIONS,
      };
    } else if (type === ColumnType.Dropdown) {
      columnConfig = {
        type: ColumnType.Dropdown,
        options: DEFAULT_DROPDOWN_OPTIONS,
      };
    }

    const newColumnToAdd: Column = {
      id: columnId,
      name,
      type,
      boardId: currentBoard.id,
      config: columnConfig,
    };
    addColumn(newColumnToAdd);

    const updatedBoard = {
      ...currentBoard,
      columns: [...boardColumns, newColumnToAdd],
    };
    updateBoard(updatedBoard);

    boardGroups.forEach((group) => {
      group.items.forEach((itemId) => {
        const currentItem = items[itemId];
        if (currentItem) {
          const defaultValue = type === ColumnType.Checkbox ? false : "";
          updateItem({ ...currentItem, [columnId]: defaultValue } as Item);
        }
      });
    });
  };

  const handleEditColumnStart = (column: Column) => {
    setEditingColumnId(column.id);
    setEditColumnName(column.name);
    setEditColumnType(column.type);
  };

  const handleEditColumnSave = (column: Column) => {
    if (!editColumnName.trim()) return;
    updateColumn({
      ...column,
      name: editColumnName,
      type: editColumnType,
    });
    setEditingColumnId(null);
  };

  const handleEditColumnCancel = () => {
    setEditingColumnId(null);
  };

  const handleDeleteColumnConfirm = (column: Column) => {
    if (!currentBoard) return;
    boardGroups.forEach((group) => {
      group.items.forEach((itemId) => {
        const currentItem = items[itemId];
        if (currentItem) {
          const { [column.id]: _, ...rest } = currentItem;
          updateItem(rest as Item);
        }
      });
    });
    removeColumn(column.id);
    const updatedBoardColumns = boardColumns.filter((c) => c.id !== column.id);
    const updatedBoard = {
      ...currentBoard,
      columns: updatedBoardColumns,
    };
    updateBoard(updatedBoard);

    setShowDeleteColumnId(null);
  };

  const editCellRefs = useRef<
    Record<
      string,
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
    >
  >({});

  const handleCellKeyDown = (
    e: React.KeyboardEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    item: Item,
    columnIdOrder: string[],
    currentColumnIndex: number,
  ) => {
    if (!currentBoard) return;
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditItemSave(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleEditItemCancel();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const nextIndex = e.shiftKey
        ? currentColumnIndex - 1
        : currentColumnIndex + 1;
      if (nextIndex >= 0 && nextIndex < columnIdOrder.length) {
        const nextColId = columnIdOrder[nextIndex];
        if (nextColId) {
          const cellToFocus =
            editCellRefs.current[item.id + "_" + nextColId] ??
            editCellRefs.current[item.id + "_name"];
          if (cellToFocus) {
            cellToFocus.focus();
            if (
              cellToFocus.tagName === "INPUT" &&
              (cellToFocus as HTMLInputElement).type !== "checkbox" &&
              (cellToFocus as HTMLInputElement).type !== "radio"
            ) {
              (cellToFocus as HTMLInputElement).select();
            }
          }
        }
      } else if (!e.shiftKey && nextIndex === columnIdOrder.length) {
        handleEditItemSave(item);
      } else if (e.shiftKey && nextIndex < 0) {
        handleEditItemSave(item);
      }
    }
  };

  // DnD Handlers
  const handleReorderItem = (
    groupId: string | undefined,
    fromIdx: number,
    toIdx: number,
  ) => {
    if (!currentBoard || !groupId) return;
    const group = groups[groupId];
    if (!group) return;
    const newItems = [...group.items];
    const [moved] = newItems.splice(fromIdx, 1);
    if (moved) {
      newItems.splice(toIdx, 0, moved);
      updateGroup({ ...group, items: newItems });
    }
  };

  // Column reordering handler
  const handleReorderColumn = (fromIdx: number, toIdx: number) => {
    if (!currentBoard) return;
    const newColumns = [...boardColumns];
    const [moved] = newColumns.splice(fromIdx, 1);
    if (moved) {
      newColumns.splice(toIdx, 0, moved);
      const updatedBoard = {
        ...currentBoard,
        columns: newColumns,
      };
      updateBoard(updatedBoard);
    }
  };

  const handleMoveItem = (
    fromGroupId: string | undefined,
    toGroupId: string | undefined,
    fromIdx: number,
    toIdx: number,
  ) => {
    if (!currentBoard || !fromGroupId || !toGroupId) return;
    const fromGroup = groups[fromGroupId];
    const toGroup = groups[toGroupId];
    if (!fromGroup || !toGroup) return;
    const itemId = fromGroup.items[fromIdx];
    if (!itemId) return;
    const newFromItems = [...fromGroup.items];
    newFromItems.splice(fromIdx, 1);
    const newToItems = [...toGroup.items];
    newToItems.splice(toIdx, 0, itemId);
    updateGroup({ ...fromGroup, items: newFromItems });
    updateGroup({ ...toGroup, items: newToItems });
  };

  return {
    currentBoard,
    boards,
    groups,
    items,
    storeColumns,
    boardColumns,
    boardGroups,
    updateBoard,
    updateGroup,
    updateItem,
    updateColumn,
    removeGroup,
    removeItem,
    addItem,
    addGroup,
    addColumn,
    removeColumn,

    // Group state and handlers
    editingGroupId,
    editGroupName,
    setEditGroupName,
    editGroupColor,
    setEditGroupColor,
    showDeleteGroupId,
    setShowDeleteGroupId,
    handleAddGroup,
    handleEditGroupStart,
    handleEditGroupSave,
    handleEditGroupCancel,
    handleDeleteGroupConfirm,

    // Item state and handlers
    editingItemId,
    editingItemGroupId,
    editItemValues,
    setEditItemValues,
    showDeleteItemId,
    setShowDeleteItemId,
    handleAddItem,
    handleEditItemStart,
    handleEditItemSave,
    handleEditItemCancel,
    handleDeleteItemConfirm,
    handleBulkDeleteItems,

    // Column state and handlers
    editingColumnId,
    editColumnName,
    setEditColumnName,
    editColumnType,
    setEditColumnType,
    showDeleteColumnId,
    setShowDeleteColumnId,
    handleAddColumn,
    handleEditColumnStart,
    handleEditColumnSave,
    handleEditColumnCancel,
    handleDeleteColumnConfirm,

    // Cell editing refs and keydown handler
    editCellRefs,
    handleCellKeyDown,

    // DnD Handlers
    handleReorderItem,
    handleReorderColumn,
    handleMoveItem,
  };
};
