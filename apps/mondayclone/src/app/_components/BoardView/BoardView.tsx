"use client";

import {
  Archive,
  ChevronDown,
  Copy,
  FilesIcon,
  Filter,
  GripVertical,
  MoveRight,
  Plus,
  Search,
  Settings,
  SquareArrowOutUpRight,
  Trash,
  User,
  X,
} from "lucide-react";
import type { Board, Item } from "../../../types/board";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import React, { useEffect, useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";

import { AddGroupDialog } from "./BoardDialogs";
import { Button } from "@acme/ui/button";
import GroupSection from "./GroupSection";
import { Input } from "@acme/ui/input";
import { useBoardInteractions } from "./hooks/useBoardInteractions";
import { useBoardStore } from "../../../store/boardStore";

const getRandomColor = (id: string): string => {
  const colors: string[] = [
    "#00c875", // Green
    "#fdab3d", // Yellow
    "#e2445c", // Red
    "#0086c0", // Blue
    "#a25ddc", // Purple
    "#00a9ff", // Teal
    "#ff642e", // Orange
    "#ff5ac4", // Pink
    "#579bfc", // Lime
    "#164b88", // Dark Blue
  ];
  if (colors.length === 0) return "#00c875";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  const index = hash % colors.length;
  return colors[index] ?? "#00c875";
};

const BoardView: React.FC = () => {
  // All hooks must be called before any conditional returns
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const interactionLogic = useBoardInteractions(activeBoardId);
  const {
    currentBoard: board,
    boardGroups,
    items,
    updateBoard,
    boardColumns,
  } = interactionLogic;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);
  const [globalSelectedItems, setGlobalSelectedItems] = useState<
    Record<string, boolean>
  >({});
  const selectedCount = Object.values(globalSelectedItems).filter(
    (selected) => selected,
  ).length;
  const [activeDndId, setActiveDndId] = useState<string | null>(null);
  const [activeDndType, setActiveDndType] = useState<
    "item" | "group" | "column" | null
  >(null);
  const [dndModifiers, setDndModifiers] = useState<Modifier[]>([]);
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    groupId: string | null;
    index: number | null;
  }>({ groupId: null, index: null });

  useEffect(() => {
    // Clean up globalSelectedItems when activeBoardId changes or component unmounts
    return () => {
      setGlobalSelectedItems({});
    };
  }, [board, activeBoardId]);

  // Early returns after all hooks
  if (!activeBoardId) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-500">
        <p>No board selected. Please select a board from the sidebar.</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-full w-full items-center justify-center text-red-500">
        <p>
          Board data not found for ID: {activeBoardId}. It might be loading or
          the ID is invalid.
        </p>
      </div>
    );
  }

  // Rest of the component logic that depends on 'board' and other states
  const handleSelectionChange = (
    groupId: string,
    selectedItemsFromGroup: Record<string, boolean>,
  ) => {
    const group = boardGroups.find((g) => g.id === groupId);
    const groupItemIds = group?.items ?? [];
    const filteredSelections = { ...globalSelectedItems };
    groupItemIds.forEach((itemId) => {
      delete filteredSelections[itemId];
    });
    setGlobalSelectedItems({
      ...filteredSelections,
      ...selectedItemsFromGroup,
    });
  };

  const handleClearAllSelections = () => {
    setGlobalSelectedItems({});
  };

  const handleDeleteSelected = () => {
    const selectedItemIds = Object.entries(globalSelectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    if (selectedItemIds.length > 0) {
      const itemsByGroup: Record<string, string[]> = {};
      selectedItemIds.forEach((itemId) => {
        const itemDetails = items[itemId];
        if (itemDetails) {
          const groupId = itemDetails.groupId;
          if (!itemsByGroup[groupId]) {
            itemsByGroup[groupId] = [];
          }
          itemsByGroup[groupId].push(itemId);
        }
      });
      Object.entries(itemsByGroup).forEach(([groupId, groupItemIds]) => {
        const group = boardGroups.find((g) => g.id === groupId);
        if (group) {
          interactionLogic.handleBulkDeleteItems(groupItemIds, group);
        }
      });
      setGlobalSelectedItems({});
    }
  };

  const handleReorderGroup = (fromIdx: number, toIdx: number) => {
    const newGroupOrder = [...boardGroups.map((g) => g.id)];
    const [moved] = newGroupOrder.splice(fromIdx, 1);
    if (moved) {
      newGroupOrder.splice(toIdx, 0, moved);
      const updatedBoardData: Board = {
        ...board,
        groups: newGroupOrder,
      };
      updateBoard(updatedBoardData);
    }
  };

  const findGroupAndIndex = (itemId: string) => {
    for (const group of boardGroups) {
      const idx = group.items.indexOf(itemId);
      if (idx !== -1) return { group, idx };
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveDndId(id);

    // Determine the type of element being dragged
    const isGroup = boardGroups.some((group) => group.id === id);
    const isColumn = boardColumns.some((column) => column.id === id);
    const type = isGroup ? "group" : isColumn ? "column" : "item";
    setActiveDndType(type);

    // If dragging a group, set the draggingGroupId to collapse it
    if (type === "group") {
      setDraggingGroupId(id);
    }

    // Set appropriate modifiers based on drag type
    if (type === "column") {
      setDndModifiers([restrictToHorizontalAxis]);
    } else if (type === "group") {
      setDndModifiers([restrictToVerticalAxis]);
    } else {
      setDndModifiers([]);
    }

    setDropTarget({ groupId: null, index: null }); // Reset drop target on new drag
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (activeDndType === "item") {
      const activeItemData = findGroupAndIndex(active.id as string);
      const overItemData = findGroupAndIndex(over.id as string);

      if (
        activeItemData &&
        overItemData &&
        activeItemData.group.id === overItemData.group.id
      ) {
        // Reordering within the same group
        setDropTarget({
          groupId: overItemData.group.id,
          index: overItemData.idx,
        });
      } else if (
        activeItemData &&
        overItemData &&
        activeItemData.group.id !== overItemData.group.id
      ) {
        // Moving to a different group (hovering over an item in another group)
        setDropTarget({
          groupId: overItemData.group.id,
          index: overItemData.idx,
        });
      } else if (activeItemData && boardGroups.some((g) => g.id === over.id)) {
        // Moving to an empty group (hovering over the group itself)
        setDropTarget({
          groupId: over.id as string,
          index: 0, // Add to the beginning of the group
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveDndId(null);
      setActiveDndType(null);
      setDraggingGroupId(null);
      setDndModifiers([]); // Reset modifiers after drag
      setDropTarget({ groupId: null, index: null });
      return;
    }

    if (activeDndType === "item") {
      const activeItemData = findGroupAndIndex(active.id as string);
      const dropGroupId = dropTarget.groupId;
      const dropIndex = dropTarget.index;

      if (activeItemData && dropGroupId !== null && dropIndex !== null) {
        if (activeItemData.group.id === dropGroupId) {
          // Reorder within the same group
          interactionLogic.handleReorderItem(
            dropGroupId,
            activeItemData.idx,
            dropIndex,
          );
        } else {
          // Move to a different group
          interactionLogic.handleMoveItem(
            activeItemData.group.id,
            dropGroupId,
            activeItemData.idx,
            dropIndex,
          );
        }
      }
    } else if (activeDndType === "group") {
      const fromIndex = boardGroups.findIndex((g) => g.id === active.id);
      const toIndex = boardGroups.findIndex((g) => g.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        handleReorderGroup(fromIndex, toIndex);
      }
    }
    setActiveDndId(null);
    setActiveDndType(null);
    setDraggingGroupId(null);
    setDndModifiers([]); // Reset modifiers after drag
    setDropTarget({ groupId: null, index: null });
  };

  return (
    <div className="flex h-full flex-col bg-[#f6f7fb] dark:bg-zinc-900">
      {/* Board header section */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Board View
          </h1>
          <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-zinc-800">
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative mr-2">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search"
              className="h-8 w-40 rounded-md border-gray-300 pl-8 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            <User className="h-3.5 w-3.5" /> Person
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="h-8 p-0 px-2">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          modifiers={dndModifiers}
        >
          {/* Render groups with SortableContext for group reordering */}
          <SortableContext
            items={boardGroups.map((group) => group.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {boardGroups.map((group) => {
                const itemsInGroup = group.items
                  .map((itemId) => items[itemId])
                  .filter((item): item is Item => Boolean(item));
                const isDropTarget =
                  dropTarget.groupId === group.id && activeDndId;
                const dropIndex = isDropTarget ? dropTarget.index : null;
                const isDraggingOver = isDropTarget && activeDndId;
                const groupColor = getRandomColor(group.id);

                // Extract selections only for this group
                const groupSelections: Record<string, boolean> = {};
                group.items.forEach((itemId) => {
                  groupSelections[itemId] = !!globalSelectedItems[itemId];
                });

                return (
                  <GroupSection
                    key={group.id}
                    group={group}
                    boardColumns={boardColumns}
                    itemsInGroup={itemsInGroup}
                    interactionLogic={interactionLogic}
                    isAddGroupDialogOpen={isAddGroupDialogOpen}
                    onToggleAddGroupDialog={setIsAddGroupDialogOpen}
                    onAddColumn={(name, type) =>
                      interactionLogic.handleAddColumn(name, type)
                    }
                    isDropTarget={Boolean(isDropTarget)}
                    dropIndex={dropIndex}
                    isDraggingOver={Boolean(isDraggingOver)}
                    _activeId={activeDndId}
                    activeType={
                      activeDndType === "item" || activeDndType === "group"
                        ? activeDndType
                        : null
                    }
                    isGroupBeingDragged={Boolean(draggingGroupId)}
                    _isThisGroupDragging={group.id === draggingGroupId}
                    groupColor={groupColor}
                    selectedItems={groupSelections}
                    onSelectionChange={(selections) =>
                      handleSelectionChange(group.id, selections)
                    }
                  />
                );
              })}
            </div>
          </SortableContext>

          {/* Add New Group button */}
          <Button
            className="ml-1 mt-5"
            variant="outline"
            size="sm"
            onClick={() => setIsAddGroupDialogOpen(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Group
          </Button>

          {/* AddGroupDialog */}
          <AddGroupDialog
            isOpen={isAddGroupDialogOpen}
            onOpenChange={setIsAddGroupDialogOpen}
            onAddGroup={(name, color) => {
              interactionLogic.handleAddGroup(name, color);
              setIsAddGroupDialogOpen(false);
            }}
          />

          {/* Item/Group drag overlay */}
          {activeDndId && (
            <DragOverlay adjustScale={false}>
              {activeDndType === "group" ? (
                <div
                  className="w-full max-w-3xl rounded-md border border-yellow-500 bg-white p-3 shadow-lg dark:border-yellow-600 dark:bg-zinc-800"
                  style={{
                    // Fixed height to avoid jump when groups collapse
                    height: "48px",
                    // Use a max-width to avoid very wide overlay
                    width: "min(100%, 400px)",
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-2"
                    style={{
                      borderLeft: `6px solid ${getRandomColor(activeDndId)}`,
                      background: "#f6f7fb",
                    }}
                  >
                    <span className="text-base font-medium text-gray-800 dark:text-gray-200">
                      {boardGroups.find((g) => g.id === activeDndId)?.name ??
                        "Group being dragged"}
                    </span>
                  </div>
                </div>
              ) : activeDndType === "column" ? (
                <div
                  key={`drag-overlay-column-${activeDndId}`}
                  className="flex items-center gap-1.5 rounded border border-yellow-500 bg-white px-2 py-2 shadow-2xl dark:border-yellow-600 dark:bg-zinc-800"
                  style={{
                    minWidth: 120,
                    maxWidth: 220,
                    opacity: 0.98,
                    zIndex: 9999,
                    transform: "translateY(-6px)",
                    boxShadow:
                      "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.12)",
                  }}
                >
                  <span className="mr-1 flex h-4 w-4 items-center justify-center text-gray-300 dark:text-gray-600">
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate text-xs font-medium text-gray-600 dark:text-gray-300">
                    {boardColumns.find((col) => col.id === activeDndId)?.name ??
                      "Column"}
                  </span>
                </div>
              ) : (
                <div className="rounded-md border border-yellow-500 bg-white p-2 shadow-md dark:border-yellow-600 dark:bg-zinc-800">
                  {items[activeDndId]?.name ?? "Item being dragged"}
                </div>
              )}
            </DragOverlay>
          )}
        </DndContext>
      </div>

      {/* Global Selection Actions Drawer */}
      {selectedCount > 0 && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-white px-4 py-3 shadow-lg dark:bg-zinc-800"
          style={{
            width: "auto",
            minWidth: "460px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white"
              style={{ fontSize: "14px", fontWeight: "bold" }}
            >
              {selectedCount}
            </div>
            <span className="text-sm font-medium">
              {selectedCount === 1 ? "Item selected" : "Items selected"}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              title="Duplicate"
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600"
            >
              <Copy className="h-5 w-5" />
              <span className="text-xs">Duplicate</span>
            </button>
            <button
              title="Export"
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600"
            >
              <FilesIcon className="h-5 w-5" />
              <span className="text-xs">Export</span>
            </button>
            <button
              title="Archive"
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600"
            >
              <Archive className="h-5 w-5" />
              <span className="text-xs">Archive</span>
            </button>
            <button
              title="Delete"
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-red-600"
              onClick={handleDeleteSelected}
            >
              <Trash className="h-5 w-5" />
              <span className="text-xs">Delete</span>
            </button>
            <button
              title="Convert"
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600"
            >
              <SquareArrowOutUpRight className="h-5 w-5" />
              <span className="text-xs">Convert</span>
            </button>
            <button
              title="Move to"
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600"
            >
              <MoveRight className="h-5 w-5" />
              <span className="text-xs">Move to</span>
            </button>
            <button
              title="Apps"
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600"
            >
              <div className="relative flex h-5 w-5 items-center justify-center">
                <div className="absolute h-2.5 w-2.5 rounded bg-gray-300"></div>
                <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded bg-green-300"></div>
                <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded bg-purple-300"></div>
              </div>
              <span className="text-xs">Apps</span>
            </button>
          </div>
          <button
            className="ml-5 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            onClick={handleClearAllSelections}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default BoardView;
