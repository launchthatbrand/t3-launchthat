import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface DraggableItemProps {
  id: string;
  type: string; // e.g., 'lesson', 'topic', 'quiz'
  children: React.ReactNode;
  className?: string;
  data?: Record<string, unknown>; // Use unknown instead of any
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  type,
  children,
  className,
  data = {},
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
      data: { type, ...data }, // Include type and any other data
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none", // Recommended for draggable items
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={className}
      aria-label={`Draggable ${type}: ${id}`} // Basic accessibility
    >
      {children}
    </div>
  );
};

export default DraggableItem; // Ensure default export
