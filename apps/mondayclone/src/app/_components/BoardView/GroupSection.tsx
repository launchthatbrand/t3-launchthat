"use client";

import React, { useEffect, useState } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, PlusIcon } from "lucide-react";

import { cn } from "@acme/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import type { Column, Group, Item } from "../../../types/board";
import type { useBoardInteractions } from "./hooks/useBoardInteractions";
import { ColumnType } from "../../../types/board";
import BoardHeaderRow from "./BoardHeaderRow";
import ItemRow from "./ItemRow";

const noop = Function.prototype as () => void;

interface GroupSectionProps {
  group: Group;
  boardColumns: Column[];
  itemsInGroup: Item[];
  interactionLogic: ReturnType<typeof useBoardInteractions>;
  isAddGroupDialogOpen: boolean;
  onToggleAddGroupDialog: (isOpen: boolean) => void;
  onAddColumn: (name: string, type: ColumnType) => void;
  isDropTarget: boolean;
  dropIndex: number | null;
  isDraggingOver: boolean;
  _activeId: string | null;
  activeType: "item" | "group" | null;
  groupColor: string;
  selectedItems: Record<string, boolean>;
  onSelectionChange: (selections: Record<string, boolean>) => void;
  isGroupBeingDragged: boolean;
  _isThisGroupDragging: boolean;
}

const GroupSection: React.FC<GroupSectionProps> = ({
  group,
  boardColumns,
  itemsInGroup,
  interactionLogic,
  isDropTarget,
  dropIndex,
  isDraggingOver,
  _activeId,
  activeType,
  groupColor,
  onAddColumn,
  selectedItems,
  onSelectionChange,
  isGroupBeingDragged,
  _isThisGroupDragging,
}) => {
  const { handleAddItem } = interactionLogic;

  // Add state to track if content should be visible with transition effects
  const [contentVisible, setContentVisible] = useState(!isGroupBeingDragged);

  // Update contentVisible with a delay when isGroupBeingDragged changes
  useEffect(() => {
    if (isGroupBeingDragged) {
      // Brief delay before collapsing content to allow drag to stabilize
      const timer = setTimeout(() => {
        setContentVisible(false);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setContentVisible(true);
    }
  }, [isGroupBeingDragged]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSelectItem = (itemId: string, selected: boolean) => {
    const updatedSelections = { ...selectedItems, [itemId]: selected };
    onSelectionChange(updatedSelections);
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelections = { ...selectedItems };
    itemsInGroup.forEach((item) => {
      newSelections[item.id] = selected;
    });
    onSelectionChange(newSelections);
  };

  const anyItemSelected = Object.values(selectedItems).some((s) => s);

  const rows: React.ReactNode[] = [];
  if (Array.isArray(itemsInGroup) && itemsInGroup.length > 0) {
    itemsInGroup.forEach((item, idx) => {
      if (isDropTarget && dropIndex === idx && activeType === "item") {
        rows.push(
          <TableRow key={`drop-placeholder-${idx}`} className="h-0 p-0">
            <TableCell
              colSpan={boardColumns.length + 2}
              className="h-1 border-2 border-dashed border-blue-400 bg-blue-50/30 p-0 dark:bg-blue-900/10"
            />
          </TableRow>,
        );
      }
      rows.push(
        <ItemRow
          key={item.id}
          item={item}
          boardColumns={boardColumns}
          isEditingThisItem={false}
          editItemValues={{}}
          _editCellRefs={{ current: {} }}
          _onEditItemStart={noop}
          onEditItemSave={noop}
          onEditItemCancel={noop}
          onSetEditItemValues={noop}
          onCellKeyDown={noop}
          isSelected={!!selectedItems[item.id]}
          onSelectItem={handleSelectItem}
          _anyItemSelected={anyItemSelected}
        />,
      );
    });
    if (
      isDropTarget &&
      dropIndex === itemsInGroup.length &&
      activeType === "item"
    ) {
      rows.push(
        <TableRow key="drop-placeholder-end" className="h-0 p-0">
          <TableCell
            colSpan={boardColumns.length + 2}
            className="h-1 border-2 border-dashed border-blue-400 bg-blue-50/30 p-0 dark:bg-blue-900/10"
          />
        </TableRow>,
      );
    }
  } else {
    if (isDropTarget && activeType === "item") {
      rows.push(
        <TableRow key="drop-placeholder-empty" className="h-0 p-0">
          <TableCell
            colSpan={boardColumns.length + 2}
            className="h-1 border-2 border-dashed border-blue-400 bg-blue-50/30 p-0 dark:bg-blue-900/10"
          />
        </TableRow>,
      );
    }
  }

  const footerValues: Record<string, string | number | null> = {};
  boardColumns.forEach((col) => {
    if (col.type === ColumnType.Number) {
      const sum = itemsInGroup.reduce((acc, item) => {
        const val = parseFloat(item[col.id] as string);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      footerValues[col.id] = `${sum} sum`;
    } else if (
      col.name.toLowerCase().includes("doc") ||
      col.type === ColumnType.Link
    ) {
      const count = itemsInGroup.filter((item) => {
        const cellValue = item[col.id];
        return (
          typeof cellValue === "string" &&
          cellValue.trim() !== "" &&
          cellValue !== "-"
        );
      }).length;
      footerValues[col.id] = count > 0 ? `${count} docs` : null;
    } else {
      footerValues[col.id] = null;
    }
  });

  const isBeingDragged =
    isDragging || (activeType === "group" && _activeId === group.id);

  // When any group is being dragged, collapse all groups
  const shouldShowContent = !isGroupBeingDragged;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("mb-1", isBeingDragged && "opacity-60 shadow-2xl")}
    >
      <div
        className="flex items-center py-1 pl-0.5 pr-2"
        style={{ borderLeft: `4px solid ${groupColor}` }}
      >
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          style={{ cursor: isBeingDragged ? "grabbing" : "grab" }}
          aria-label="Drag to reorder group"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <ChevronDown className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-500" />
        <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
          {group.name}
        </span>
        <span className="ml-2 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
          {itemsInGroup.length} Items
        </span>
        <div className="ml-auto"></div>
      </div>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          height: contentVisible ? "auto" : "0",
          opacity: contentVisible ? 1 : 0,
          // If not dragging, transition immediately
          // If dragging (collapsing), delay the transition
          transitionDelay: isGroupBeingDragged ? "100ms" : "0ms",
        }}
      >
        {shouldShowContent && (
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            <Table
              className={cn(
                "border-separate border-spacing-0",
                isDropTarget && "border-blue-500",
              )}
            >
              <TableHeader>
                <BoardHeaderRow
                  boardColumns={boardColumns}
                  editingColumnId={interactionLogic.editingColumnId}
                  editColumnName={interactionLogic.editColumnName}
                  setEditColumnName={interactionLogic.setEditColumnName}
                  editColumnType={interactionLogic.editColumnType}
                  setEditColumnType={interactionLogic.setEditColumnType}
                  showDeleteColumnId={interactionLogic.showDeleteColumnId}
                  onEditColumnStart={interactionLogic.handleEditColumnStart}
                  onEditColumnSave={interactionLogic.handleEditColumnSave}
                  onEditColumnCancel={interactionLogic.handleEditColumnCancel}
                  onShowDeleteColumnId={interactionLogic.setShowDeleteColumnId}
                  onDeleteColumnConfirm={
                    interactionLogic.handleDeleteColumnConfirm
                  }
                  onAddColumn={onAddColumn}
                  selectedItems={selectedItems}
                  onSelectAll={handleSelectAll}
                />
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={itemsInGroup.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rows}
                </SortableContext>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={boardColumns.length + 2}
                    className="cursor-pointer bg-gray-50 p-0 text-center hover:bg-gray-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/50"
                    onClick={() => handleAddItem(group)}
                  >
                    <div className="flex h-8 items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                      <PlusIcon className="mr-1 h-3 w-3" /> Add Item
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>

      {isDropTarget &&
        activeType === "item" &&
        dropIndex === itemsInGroup.length && (
          <div className="mt-1 h-8 rounded border border-dashed border-gray-300 bg-gray-50 dark:border-zinc-600 dark:bg-zinc-800"></div>
        )}
      {isDraggingOver && activeType === "group" && (
        <div className="mt-1 h-16 rounded border-2 border-dashed border-blue-500"></div>
      )}
    </div>
  );
};

export default GroupSection;
