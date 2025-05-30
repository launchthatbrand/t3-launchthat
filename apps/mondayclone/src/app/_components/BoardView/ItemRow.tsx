"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical } from "lucide-react";

import { cn } from "@acme/ui";

import type { Column, Item } from "../../../types/board";
import { ColumnType } from "../../../types/board";
import EditableCell from "./EditableCell";

interface ItemRowProps {
  item: Item;
  boardColumns: Column[];
  isEditingThisItem: boolean;
  editItemValues: Record<string, unknown>;
  _editCellRefs: React.MutableRefObject<
    Record<
      string,
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
    >
  >;
  _onEditItemStart: (item: Item, groupId: string) => void;
  onEditItemSave: (item: Item) => void;
  onEditItemCancel: () => void;
  onSetEditItemValues: React.Dispatch<
    React.SetStateAction<Record<string, unknown>>
  >;
  onCellKeyDown: (
    e: React.KeyboardEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    item: Item,
    columnIdOrder: string[],
    currentColumnIndex: number,
  ) => void;
  isSelected: boolean;
  onSelectItem: (itemId: string, selected: boolean) => void;
  _anyItemSelected: boolean;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  boardColumns,
  isEditingThisItem,
  editItemValues,
  _editCellRefs,
  _onEditItemStart,
  onEditItemSave,
  onEditItemCancel,
  onSetEditItemValues,
  onCellKeyDown,
  isSelected,
  onSelectItem,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCellValueChange = (columnId: string, value: unknown) => {
    const column = boardColumns.find((c) => c.id === columnId);
    if (column && column.type === ColumnType.Name) {
      onSetEditItemValues((prev) => ({ ...prev, name: value as string }));
    } else {
      onSetEditItemValues((prev) => ({ ...prev, [columnId]: value }));
    }
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/itemrow transition-colors",
        isDragging && "bg-yellow-100 dark:bg-yellow-900/60",
        isSelected && "bg-blue-100 dark:bg-blue-900/30",
        !isSelected &&
          !isDragging &&
          "hover:bg-gray-50/50 dark:hover:bg-zinc-800/50",
      )}
    >
      <td className="sticky left-0 z-[1] w-12 bg-inherit px-0 py-0 text-center align-middle">
        <div className="flex h-full items-center justify-center border-r border-gray-200 dark:border-zinc-700">
          <button
            type="button"
            aria-label="Drag item"
            className="invisible mr-1 cursor-grab p-1 group-hover/itemrow:visible"
            {...attributes}
            {...listeners}
          >
            <GripVertical
              className="h-4 w-4 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
            />
          </button>
          <div
            className={cn(
              "ml-auto mr-1 flex h-3.5 w-3.5 flex-shrink-0 cursor-pointer items-center justify-center rounded-sm border",
              isSelected
                ? "border-transparent bg-blue-500"
                : "border-gray-300 dark:border-zinc-600",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelectItem(item.id, !isSelected);
            }}
          >
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      </td>

      {boardColumns.map((col, colIdx) => (
        <td
          key={col.id}
          className={cn(
            "cursor-pointer px-2 py-1.5 align-middle",
            colIdx === 0 && "sticky z-[1] bg-inherit",
          )}
          style={colIdx === 0 ? { left: "48px" } : {}}
          onClick={(e) => {
            // Always trigger edit mode when the cell is clicked
            if (!isEditingThisItem) {
              e.stopPropagation();
              _onEditItemStart(item, item.groupId);
            }
          }}
        >
          <EditableCell
            item={item}
            column={col}
            isEditing={
              isEditingThisItem &&
              Object.prototype.hasOwnProperty.call(editItemValues, col.id)
            }
            value={
              isEditingThisItem &&
              Object.prototype.hasOwnProperty.call(editItemValues, col.id)
                ? editItemValues[col.id]
                : item[col.id]
            }
            onChange={handleCellValueChange}
            onSave={() => onEditItemSave(item)}
            onCancel={onEditItemCancel}
            onKeyDown={onCellKeyDown}
            boardColumns={boardColumns}
            inputRef={(el) => {
              // This will be handled by parent implementation without directly mutating props
              if (_editCellRefs && el) {
                // Clone current refs and add the new one
                const refKey = `${item.id}_${col.id}`;
                const updatedRefs = {
                  ..._editCellRefs.current,
                  [refKey]: el,
                };
                // Replace entire ref object instead of mutating
                _editCellRefs.current = updatedRefs;
              }
            }}
          />
        </td>
      ))}
      <td className="sticky right-0 z-[1] w-10 border-l border-gray-200 bg-inherit px-1 py-2 dark:border-zinc-700"></td>
    </tr>
  );
};

export default ItemRow;
