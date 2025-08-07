"use client";

import React from "react";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { Check } from "lucide-react";

import { cn } from "@acme/ui";

import type { Column } from "../../../types/board";
import type { ColumnType } from "../../../types/board";
import AddColumnCombobox from "./AddColumnCombobox";
import ColumnHeaderCell from "./ColumnHeaderCell";

interface BoardHeaderRowProps {
  boardColumns: Column[];
  editingColumnId: string | null;
  editColumnName: string;
  setEditColumnName: (name: string) => void;
  editColumnType: ColumnType;
  setEditColumnType: (type: ColumnType) => void;
  showDeleteColumnId: string | null;
  onEditColumnStart: (column: Column) => void;
  onEditColumnSave: (column: Column) => void;
  onEditColumnCancel: () => void;
  onShowDeleteColumnId: (id: string | null) => void;
  onDeleteColumnConfirm: (column: Column) => void;
  onAddColumn: (name: string, type: ColumnType) => void;
  selectedItems: Record<string, boolean>;
  onSelectAll: (selected: boolean) => void;
}

const BoardHeaderRow: React.FC<BoardHeaderRowProps> = ({
  boardColumns,
  editingColumnId,
  editColumnName,
  setEditColumnName,
  editColumnType,
  setEditColumnType,
  showDeleteColumnId,
  onEditColumnStart,
  onEditColumnSave,
  onEditColumnCancel,
  onShowDeleteColumnId,
  onDeleteColumnConfirm,
  onAddColumn,
  selectedItems,
  onSelectAll,
}) => {
  const hasItems = Object.keys(selectedItems).length > 0;
  const allSelected =
    hasItems && Object.values(selectedItems).every((selected) => selected);
  const someSelected =
    hasItems && Object.values(selectedItems).some((selected) => selected);

  return (
    <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-zinc-700 dark:bg-zinc-800/30">
      <th className="sticky left-0 top-0 z-[1] w-12 border-r border-gray-200 bg-inherit px-0 py-0 text-center align-middle dark:border-zinc-700">
        <div className="flex h-full items-center justify-center">
          <div
            className={cn(
              "flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm border",
              allSelected || someSelected
                ? "border-transparent bg-blue-500"
                : "border-gray-300 dark:border-zinc-600",
            )}
            onClick={() => hasItems && onSelectAll(!allSelected)}
            aria-label={allSelected ? "Deselect all items" : "Select all items"}
          >
            {(allSelected || someSelected) && (
              <Check className="h-3 w-3 text-white" />
            )}
          </div>
        </div>
      </th>

      <SortableContext
        items={boardColumns.map((col) => col.id)}
        strategy={horizontalListSortingStrategy}
      >
        {boardColumns.map((column) => (
          <ColumnHeaderCell
            key={column.id}
            column={column}
            isEditingThisColumn={editingColumnId === column.id}
            editColumnName={editColumnName}
            editColumnType={editColumnType}
            onSetEditColumnName={setEditColumnName}
            onSetEditColumnType={setEditColumnType}
            onEditColumnStart={onEditColumnStart}
            onEditColumnSave={onEditColumnSave}
            onEditColumnCancel={onEditColumnCancel}
            showDeleteColumnId={showDeleteColumnId}
            onShowDeleteColumnId={onShowDeleteColumnId}
            onDeleteColumnConfirm={onDeleteColumnConfirm}
          />
        ))}
      </SortableContext>
      <th className="sticky right-0 top-0 z-[1] w-10 border-l border-gray-200 bg-inherit px-1 py-2 text-center align-middle dark:border-zinc-700">
        <AddColumnCombobox
          onAddColumn={onAddColumn}
          existingColumns={boardColumns}
        />
      </th>
    </tr>
  );
};

export default BoardHeaderRow;
