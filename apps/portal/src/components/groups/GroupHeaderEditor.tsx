"use client";

import React, { useEffect } from "react";
import { useCarouselStore } from "@/store";
import { Pencil } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@acme/ui/drawer";

import type { Id } from "../../../convex/_generated/dataModel";
import type { CarouselItem } from "./GroupHeaderCarousel";
import { GroupHeaderEditorForm } from "./GroupHeaderEditorForm";

interface GroupHeaderEditorProps {
  groupId: Id<"groups">;
  onSave: (items: CarouselItem[]) => void;
}

export function GroupHeaderEditor({ groupId, onSave }: GroupHeaderEditorProps) {
  const { isEditorOpen, setEditorOpen } = useCarouselStore();

  // Add debugging
  useEffect(() => {
    console.log(
      "[GroupHeaderEditor] Component mounted, editor button should be visible",
    );
  }, []);

  // Don't set items here - this creates a loop with the GroupProfile component
  // that's also setting items. The initial items are set in GroupProfile.

  const handleSave = (items: CarouselItem[]) => {
    console.log("[GroupHeaderEditor] Saving items:", items);
    onSave(items);
    setEditorOpen(false);
  };

  return (
    <Drawer
      open={isEditorOpen}
      onOpenChange={setEditorOpen}
      modal={false}
      direction="left"
    >
      <DrawerTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="absolute right-4 top-4 z-50 flex animate-pulse items-center gap-1 rounded-full bg-primary px-3 py-2 text-primary-foreground shadow-lg backdrop-blur-sm hover:bg-primary/90 hover:text-primary-foreground"
          onClick={(e) => {
            console.log("[GroupHeaderEditor] Edit button clicked");
            e.preventDefault();
            setEditorOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
          <span>Edit Header</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-svh max-w-[var(--sidebar-width)]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit Group Header</DrawerTitle>
          <DrawerDescription>
            Customize your group header with images and carousel slides.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <GroupHeaderEditorForm groupId={groupId} onSave={handleSave} />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
