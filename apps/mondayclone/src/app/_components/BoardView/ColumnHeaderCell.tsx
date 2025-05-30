"use client";

import { ChevronDown, GripVertical } from "lucide-react";
import { ColumnConfigDialog, DeleteConfirmationDialog } from "./BoardDialogs";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import React, { useState } from "react";

import { Button } from "@acme/ui/button";
import { CSS } from "@dnd-kit/utilities";
import type { Column } from "../../../types/board";
import { ColumnType } from "../../../types/board";
import ColumnTypeIcon from "./ColumnTypeIcon";
import { Input } from "@acme/ui/input";
import type { KeyboardEvent } from "react";
import { cn } from "@acme/ui";
import { useSortable } from "@dnd-kit/sortable";

interface ColumnHeaderCellProps {
  column: Column;
  isEditingThisColumn: boolean;
  editColumnName: string;
  editColumnType: ColumnType;
  onSetEditColumnName: (name: string) => void;
  onSetEditColumnType: (type: ColumnType) => void;
  onEditColumnStart: (column: Column) => void;
  onEditColumnSave: (column: Column) => void;
  onEditColumnCancel: () => void;
  showDeleteColumnId: string | null;
  onShowDeleteColumnId: (id: string | null) => void;
  onDeleteColumnConfirm: (column: Column) => void;
}

const ColumnHeaderCell: React.FC<ColumnHeaderCellProps> = ({
  column,
  isEditingThisColumn,
  editColumnName,
  editColumnType,
  onSetEditColumnName,
  onSetEditColumnType,
  onEditColumnStart,
  onEditColumnSave,
  onEditColumnCancel,
  showDeleteColumnId,
  onShowDeleteColumnId,
  onDeleteColumnConfirm,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // dnd-kit sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isEditingThisColumn ? undefined : "grab",
  };

  const handleSave = () => {
    onEditColumnSave({ ...column, name: editColumnName, type: editColumnType });
  };

  // Handle saving column configuration from the config dialog
  const handleConfigSave = (updatedColumn: Column) => {
    onEditColumnSave(updatedColumn);
    setShowConfigDialog(false);
  };

  // Add keyboard event handler for column reordering
  const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    // Support keyboard reordering
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault(); // Prevent scrolling

      // Simulate a drag start/end
      // This is a basic implementation - in a real app, you might want a more robust solution
      const columns = document.querySelectorAll("th[data-column-id]");
      const columnArray = Array.from(columns);
      const currentIndex = columnArray.findIndex(
        (col) => col.getAttribute("data-column-id") === column.id,
      );

      if (currentIndex === -1) return;

      const targetIndex =
        e.key === "ArrowLeft"
          ? Math.max(0, currentIndex - 1)
          : Math.min(columnArray.length - 1, currentIndex + 1);

      if (targetIndex !== currentIndex) {
        // Alert user about what's happening
        alert(
          `Column would be moved ${e.key === "ArrowLeft" ? "left" : "right"} (in a real implementation, this would use the reordering logic)`,
        );
      }
    }
  };

  const renderEditInput = () => (
    <div className="flex w-full flex-col gap-2 rounded-md border border-gray-300 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
      <Input
        type="text"
        value={editColumnName}
        onChange={(e) => onSetEditColumnName(e.target.value)}
        className="h-8 text-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onEditColumnCancel();
        }}
      />
      <select
        value={editColumnType}
        onChange={(e) => onSetEditColumnType(e.target.value as ColumnType)}
        className="h-8 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
      >
        {Object.values(ColumnType).map((type) => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>
      <div className="mt-1 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEditColumnCancel}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSave}
          className="text-xs"
        >
          Save
        </Button>
      </div>
    </div>
  );

  // Check if the column type can be configured (currently only Dropdown and Status)
  const canConfigure =
    column.type === ColumnType.Dropdown || column.type === ColumnType.Status;

  return (
    <th
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0 : 1 }}
      {...attributes}
      className={cn(
        "group/colheader relative truncate px-2 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300",
      )}
      data-column-id={column.id}
    >
      {isEditingThisColumn ? (
        renderEditInput()
      ) : (
        <div className="flex items-center gap-1.5">
          {/* Drag handle */}
          <span
            {...listeners}
            className="mr-1 flex h-4 w-4 cursor-grab items-center justify-center text-gray-300 hover:text-gray-500 active:cursor-grabbing dark:text-gray-600 dark:hover:text-gray-300"
            tabIndex={0}
            aria-label={`Drag to reorder column ${column.name}. Use arrow keys to reorder when focused.`}
            onKeyDown={handleKeyDown}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
          <ColumnTypeIcon
            type={column.type}
            className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500"
          />
          <span
            className="cursor-text truncate hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => onEditColumnStart(column)}
            title={column.name}
          >
            {column.name}
          </span>
          <div className="relative ml-auto">
            <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="invisible rounded p-0.5 opacity-50 hover:bg-gray-200 group-hover/colheader:visible group-hover/colheader:opacity-100 dark:hover:bg-zinc-700"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="end" sideOffset={5}>
                <div className="py-1">
                  <button
                    onClick={() => {
                      onEditColumnStart(column);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-zinc-700 dark:hover:text-white"
                  >
                    Edit column
                  </button>
                  {/* Add a Configure option to the menu */}
                  {canConfigure && (
                    <button
                      onClick={() => {
                        setShowConfigDialog(true);
                        setIsMenuOpen(false);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-zinc-700 dark:hover:text-white"
                    >
                      Configure options
                    </button>
                  )}
                  {/* Add other actions like Sort, Filter, Hide etc. here */}
                  <button
                    onClick={() => {
                      onShowDeleteColumnId(column.id);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
                  >
                    Delete column
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
      {showDeleteColumnId === column.id && (
        <DeleteConfirmationDialog
          isOpen={showDeleteColumnId === column.id}
          targetName={column.name}
          targetType="column"
          onConfirm={() => onDeleteColumnConfirm(column)}
          onCancel={() => onShowDeleteColumnId(null)}
        />
      )}
      {showConfigDialog && (
        <ColumnConfigDialog
          isOpen={showConfigDialog}
          column={column}
          onSave={handleConfigSave}
          onCancel={() => setShowConfigDialog(false)}
        />
      )}
    </th>
  );
};

export default ColumnHeaderCell;
