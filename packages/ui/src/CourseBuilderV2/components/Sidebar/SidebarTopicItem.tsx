import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Adjust the import path for the Convex Doc type
import type { Doc } from "../../../../../../apps/wsa/convex/_generated/dataModel";

interface SidebarTopicItemProps {
  topic: Doc<"topics">; // Assuming a 'topics' table exists
}

export const SidebarTopicItem: React.FC<SidebarTopicItemProps> = ({
  topic,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `sidebar-topic-${topic._id}`, // Unique ID
      data: {
        type: "sidebarTopic", // Specific type for sidebar topics
        item: topic, // Pass topic data
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      // Matching style with LessonItem
      className="mb-2 rounded border bg-card p-2 text-sm shadow-sm transition-opacity duration-150 ease-in-out"
    >
      {topic.title}
    </div>
  );
};
