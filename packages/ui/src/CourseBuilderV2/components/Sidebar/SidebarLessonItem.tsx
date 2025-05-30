import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Adjust the import path for the Convex Doc type
import type { Doc } from "../../../../../../apps/wsa/convex/_generated/dataModel";

interface SidebarLessonItemProps {
  lesson: Doc<"lessons">;
}

export const SidebarLessonItem: React.FC<SidebarLessonItemProps> = ({
  lesson,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `sidebar-lesson-${lesson._id}`, // Unique ID for this draggable item
      data: {
        type: "sidebarLesson", // Distinguish from sortable course lessons
        item: lesson, // Pass the full lesson data
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform), // Use Translate for non-sortable draggables
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
    // Add other styles as needed
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="mb-2 rounded border bg-card p-2 text-sm shadow-sm transition-opacity duration-150 ease-in-out"
    >
      {lesson.title}
    </div>
  );
};
