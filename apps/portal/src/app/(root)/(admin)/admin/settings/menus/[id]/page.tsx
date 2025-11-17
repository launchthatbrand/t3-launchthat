"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { DragEndEvent } from "@dnd-kit/core";
import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, Edit, Plus, Trash } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import {
  useAddMenuItem,
  useMenu,
  useMenuItems,
  useRemoveMenuItem,
  useReorderMenuItems,
  useUpdateMenuItem,
} from "../_api/menus";

interface SortableTableRowProps {
  item: Doc<"menuItems">;
  parentItemLabel: string | null;
  onDeleteItem: (id: Id<"menuItems">) => void;
  onEditItem: (item: Doc<"menuItems">) => void;
}

const SortableTableRow = ({
  item,
  parentItemLabel,
  onDeleteItem,
  onEditItem,
}: SortableTableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    position: "relative",
  } as React.CSSProperties;

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell
        className="cursor-grab font-medium"
        {...listeners} // Apply listeners for dragging
      >
        {item.parentId && <span className="ml-4">↳ </span>}
        {item.label}
      </TableCell>
      <TableCell>{item.url}</TableCell>
      <TableCell>{parentItemLabel ?? "-"}</TableCell>
      <TableCell>{item.order}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEditItem(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteItem(item._id)}
            disabled={item.isBuiltIn}
          >
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const getOrderValue = (value: number | null | undefined) =>
  typeof value === "number" ? value : 0;

export default function MenuItemsPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const menuId = id as Id<"menus">;
  const menu = useMenu(menuId);
  const fetchedMenuItems = useMenuItems(menuId);
  const addMenuItem = useAddMenuItem();
  const removeMenuItem = useRemoveMenuItem();
  const reorderMenuItems = useReorderMenuItems();
  const updateMenuItem = useUpdateMenuItem();

  const [itemToDelete, setItemToDelete] = useState<Id<"menuItems"> | null>(
    null,
  );
  const [menuItems, setMenuItems] = useState<Doc<"menuItems">[]>([]);

  useEffect(() => {
    if (fetchedMenuItems) {
      setMenuItems(
        [...fetchedMenuItems].sort(
          (a, b) => getOrderValue(a.order) - getOrderValue(b.order),
        ),
      );
    }
  }, [fetchedMenuItems]);

  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemParent, setNewItemParent] = useState<Id<"menuItems"> | null>(
    null,
  );

  const [isAddDialogOpened, setIsAddDialogOpened] = useState(false);
  const [isEditDialogOpened, setIsEditDialogOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<Doc<"menuItems"> | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editParent, setEditParent] = useState<Id<"menuItems"> | null>(null);

  const openEditDialog = (item: Doc<"menuItems">) => {
    setEditingItem(item);
    setEditLabel(item.label);
    setEditUrl(item.url);
    setEditParent(item.parentId ?? null);
    setIsEditDialogOpened(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpened(false);
    setEditingItem(null);
    setEditLabel("");
    setEditUrl("");
    setEditParent(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id && over?.id && active.id !== over.id) {
      setMenuItems((currentItems) => {
        const activeId = active.id as Id<"menuItems">;
        const overId = over.id as Id<"menuItems">;

        const activeItem = currentItems.find((item) => item._id === activeId);
        const overItem = currentItems.find((item) => item._id === overId);

        // Only reorder if both items exist and share the same parent, or both are top-level
        if (
          !activeItem ||
          !overItem ||
          activeItem.parentId !== overItem.parentId
        ) {
          return currentItems; // Do not reorder if parents are different
        }

        const parentIdToReorder = activeItem.parentId;

        // Filter items that belong to the same parent (or are top-level if parentId is null)
        const relevantItems = currentItems
          .filter((item) => item.parentId === parentIdToReorder)
          .sort((a, b) => getOrderValue(a.order) - getOrderValue(b.order));

        const oldIndex = relevantItems.findIndex(
          (item) => item._id === activeId,
        );
        const newIndex = relevantItems.findIndex((item) => item._id === overId);

        if (oldIndex === newIndex) {
          return currentItems;
        }

        const newOrderedRelevantItems = arrayMove(
          relevantItems,
          oldIndex,
          newIndex,
        );

        // Prepare updates for the backend
        const updates = newOrderedRelevantItems.map((item, index) => ({
          itemId: item._id,
          order: index,
        }));

        // Call mutation to update backend
        void reorderMenuItems({
          menuId,
          updates,
        });

        // Update local state by reconstructing the full list with new orders for relevant items
        const updatedMenuItems = currentItems.map((item) => {
          const updatedItem = updates.find(
            (update) => update.itemId === item._id,
          );
          return updatedItem ? { ...item, order: updatedItem.order } : item;
        });

        // The fetchedMenuItems useEffect will eventually re-sort and update the state
        // with the server's authoritative order. For immediate visual feedback, we return
        // the updated list, but without a full hierarchical re-calculation as getMenuItems
        // already handles that for us on re-fetch.
        return updatedMenuItems;
      });
    }
  };

  const handleDeleteItem = (id: Id<"menuItems"> | null) => {
    setItemToDelete(id);
  };

  if (!menu) return null;

  // These are now directly using the fetchedMenuItems (which are sorted hierarchically from backend)
  // And the `handleDragEnd` will handle re-ordering locally until the next fetch.
  // The local `menuItems` state should always reflect what's passed from `fetchedMenuItems` initially,
  // and then be updated by DND logic.
  const topLevelMenuItems = menuItems.filter((item) => item.parentId === null);
  // Helper function to get children of a parent
  const getChildren = (parentId: Id<"menuItems"> | null) => {
    return menuItems
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => getOrderValue(a.order) - getOrderValue(b.order));
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings/menus">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{menu.name}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Manage menu items for {menu.name}
        </p>
      </div>

      <div className="mb-4 flex justify-between">
        <h2 className="text-xl font-semibold">Menu Items</h2>

        <Dialog open={isAddDialogOpened} onOpenChange={setIsAddDialogOpened}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
              <DialogDescription>
                Add a new item to {menu.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-label">Label</Label>
                <Input
                  id="item-label"
                  placeholder="e.g., About Us"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-url">URL</Label>
                <Input
                  id="item-url"
                  placeholder="e.g., /about"
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-parent">Parent Item (Optional)</Label>
                <Select
                  value={
                    newItemParent ? newItemParent.toString() : "NONE_PARENT"
                  }
                  onValueChange={(val) =>
                    setNewItemParent(
                      val === "NONE_PARENT" ? null : (val as Id<"menuItems">),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE_PARENT">
                      None (Top Level)
                    </SelectItem>
                    {menuItems
                      .filter((item) => item.parentId === null)
                      .map((item) => (
                        <SelectItem key={item._id} value={item._id.toString()}>
                          {item.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  if (!newItemLabel || !newItemUrl) return;
                  await addMenuItem({
                    menuId: menuId,
                    label: newItemLabel,
                    url: newItemUrl,
                    parentId: newItemParent,
                    order: menuItems.length,
                  });
                  setNewItemLabel("");
                  setNewItemUrl("");
                  setNewItemParent(null);
                  setIsAddDialogOpened(false);
                }}
              >
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditDialogOpened && !!editingItem}
          onOpenChange={(open) => {
            if (!open) {
              closeEditDialog();
            } else if (editingItem) {
              setIsEditDialogOpened(true);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
              <DialogDescription>
                Update the selected item for {menu.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-item-label">Label</Label>
                <Input
                  id="edit-item-label"
                  placeholder="Item label"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-item-url">URL</Label>
                <Input
                  id="edit-item-url"
                  placeholder="e.g., /about"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-item-parent">Parent Item (Optional)</Label>
                <Select
                  value={editParent ? editParent.toString() : "NONE_PARENT"}
                  onValueChange={(val) =>
                    setEditParent(
                      val === "NONE_PARENT" ? null : (val as Id<"menuItems">),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE_PARENT">
                      None (Top Level)
                    </SelectItem>
                    {menuItems
                      .filter(
                        (item) =>
                          item.parentId === null &&
                          (!editingItem || item._id !== editingItem._id),
                      )
                      .map((item) => (
                        <SelectItem key={item._id} value={item._id.toString()}>
                          {item.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingItem || !editLabel || !editUrl) {
                    return;
                  }
                  await updateMenuItem({
                    itemId: editingItem._id,
                    data: {
                      label: editLabel,
                      url: editUrl,
                      parentId: editParent,
                    },
                  });
                  closeEditDialog();
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!itemToDelete}
          onOpenChange={() => setItemToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this menu item? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (itemToDelete) {
                    await removeMenuItem({ menuItemId: itemToDelete });
                    setItemToDelete(null);
                  }
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={menuItems.map((item) => item._id)} // Include all items for sorting
              strategy={verticalListSortingStrategy}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLevelMenuItems.map((item) => (
                    <React.Fragment key={item._id}>
                      <SortableTableRow
                        key={item._id}
                        item={item}
                        parentItemLabel={null}
                        onDeleteItem={handleDeleteItem}
                        onEditItem={openEditDialog}
                      />
                      {getChildren(item._id).map((childItem) => (
                        <SortableTableRow
                          key={childItem._id}
                          item={childItem}
                          parentItemLabel={item.label}
                          onDeleteItem={handleDeleteItem}
                          onEditItem={openEditDialog}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}
