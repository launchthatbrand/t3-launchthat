"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
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
} from "../_api/menus";
import { Doc } from "../../../../convex/_generated/dataModel";

interface SortableTableRowProps {
  item: Doc<"menuItems">;
  parentItemLabel: string | null;
  onDeleteItem: (id: Id<"menuItems">) => void;
}

const SortableTableRow = ({
  item,
  parentItemLabel,
  onDeleteItem,
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
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteItem(item._id)}
                disabled={item.isBuiltIn}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function MenuItemsPage({ params }: { params: { id: string } }) {
  const { id: menuId } = use(params);
  const menu = useMenu(menuId);
  const fetchedMenuItems = useMenuItems(menuId);
  const addMenuItem = useAddMenuItem();
  const removeMenuItem = useRemoveMenuItem();
  const reorderMenuItems = useReorderMenuItems();

  const [itemToDelete, setItemToDelete] = useState<Id<"menuItems"> | null>(
    null,
  );
  const [menuItems, setMenuItems] = useState<Doc<"menuItems">[]>([]);

  useEffect(() => {
    if (fetchedMenuItems) {
      setMenuItems(fetchedMenuItems);
    }
  }, [fetchedMenuItems]);

  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemParent, setNewItemParent] = useState<Id<"menuItems"> | null>(
    null,
  );

  const [isAddDialogOpened, setIsAddDialogOpened] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
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
          .sort((a, b) => a.order - b.order); // Ensure this subset is sorted by current order

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
          id: item._id,
          order: index, // Assign new order based on their position in the reordered subset
          parentId: parentIdToReorder, // Parent ID remains the same
        }));

        // Call mutation to update backend
        void reorderMenuItems({
          menuId: menuId,
          updates: updates,
        });

        // Update local state by reconstructing the full list with new orders for relevant items
        const updatedMenuItems = currentItems.map((item) => {
          const updatedItem = updates.find((update) => update.id === item._id);
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
    // Filter and sort children by their current order
    return menuItems
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.order - b.order);
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
                  value={newItemParent?.toString() ?? "NONE_PARENT"}
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
                      />
                      {getChildren(item._id).map((childItem) => (
                        <SortableTableRow
                          key={childItem._id}
                          item={childItem}
                          parentItemLabel={item.label}
                          onDeleteItem={handleDeleteItem}
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
