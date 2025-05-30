"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";

import type { CourseItemType, DraggableItemData, Id } from "../../types"; // Corrected type import path, guessing ItemType is CourseItemType, added Id

// import type { Id } from "../../../types"; // Adjusted path for Id type from Sortable folder - Removed

// Props definition for the reusable DropZone
interface DropZoneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  acceptedTypes: CourseItemType[]; // Use guessed type name
  activeDragData: DraggableItemData | null;
  style?: React.CSSProperties; // Allow passing custom styles
  data?: {
    type: string; // Expect at least a type string
    lessonId?: Id<"lessons">;
    topicId?: Id<"topics">;
    [key: string]: unknown; // Replace any with unknown
  };
}

export const DropZone: React.FC<DropZoneProps> = ({
  id,
  children,
  className,
  acceptedTypes,
  activeDragData,
  style: customStyle, // Rename incoming style prop
  data, // Destructure data prop
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data, // Pass data to useDroppable
  });

  // Determine if the currently dragged item is accepted
  const isAccepted = activeDragData
    ? acceptedTypes.includes(activeDragData.type)
    : false;
  const canDrop = isOver && isAccepted;

  const defaultStyle: React.CSSProperties = {
    transition: "background-color 0.2s ease, outline 0.2s ease",
    // Dim if not accepted and something is being dragged
    opacity: isAccepted || !activeDragData ? 1 : 0.5,
  };

  const activeStyle: React.CSSProperties = {
    backgroundColor: "rgba(0, 100, 255, 0.05)",
    outline: "1px dashed rgba(0, 100, 255, 0.5)",
    padding: "1rem", // Add padding when active for better visual feedback
  };

  const combinedStyle = {
    ...defaultStyle,
    ...(canDrop ? activeStyle : {}),
    ...customStyle, // Apply custom styles last
  };

  return (
    <div id={id} ref={setNodeRef} className={className} style={combinedStyle}>
      {children}
    </div>
  );
};
