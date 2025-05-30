import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import React from "react";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";

import { cn } from "@acme/ui";

interface DragHandleProps {
  listeners?: DraggableSyntheticListeners;
  attributes?: DraggableAttributes;
  className?: string;
  disabled?: boolean;
}

export const DragHandle: React.FC<DragHandleProps> = ({
  listeners,
  attributes,
  className,
  disabled = false,
}) => {
  const handleClasses = cn(
    "mr-2 h-4 w-4", // Base size from item components
    "text-muted-foreground",
    {
      "cursor-grab hover:text-foreground": !disabled,
      "cursor-not-allowed opacity-50": disabled,
    },
    className,
  );

  return (
    <div
      className={handleClasses}
      {...listeners}
      {...attributes}
      aria-label={disabled ? "Dragging disabled" : "Drag handle"}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <DragHandleDots2Icon />
    </div>
  );
};
