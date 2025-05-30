import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Cross2Icon } from "@radix-ui/react-icons";

import { cn } from "@acme/ui";

// Use types from the central location
import type { DraggableItemData, Id, TopicWithQuizzes } from "../../types";
// Import base components
import { DragHandle } from "./DragHandle";
// import { EditableTitle } from "./EditableTitle"; // Commented out placeholder
import { ItemWrapper } from "./ItemWrapper";

// Path relative to new location

// --- Component Props ---
interface TopicItemProps {
  topic: TopicWithQuizzes;
  isExpanded: boolean;
  isOverlay?: boolean;
  dragHandleProps?: {
    listeners?: DraggableSyntheticListeners;
    attributes?: DraggableAttributes;
  };
  activeDragData: DraggableItemData | null;
  onToggleExpand: (topicId: Id<"topics">) => void;
  _changeTopicTitle: (topicId: Id<"topics">, newTitle: string) => Promise<void>;
  removeTopic: (topicId: Id<"topics">) => Promise<void>;
}

export const TopicItem: React.FC<TopicItemProps> = ({
  topic,
  isExpanded,
  isOverlay = false,
  dragHandleProps,
  activeDragData,
  onToggleExpand,
  _changeTopicTitle,
  removeTopic,
}) => {
  // Droppable setup for the expanded content area
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `topic-${topic._id}-dropzone`,
    data: {
      type: "topicDropZone",
      topicId: topic._id,
      accepts: ["sidebarQuiz", "quiz"],
    },
  });

  // Calculate drop zone style
  const isQuizOver =
    isOver &&
    (activeDragData?.type === "quiz" || activeDragData?.type === "sidebarQuiz");

  // Render Actions Slot
  const renderActions = (
    <button
      onClick={() => removeTopic(topic._id)}
      className="text-muted-foreground hover:text-destructive"
      aria-label={`Remove topic ${topic.title}`}
      disabled={isOverlay}
    >
      <Cross2Icon className="h-4 w-4" />
    </button>
  );

  // Render Drag Handle Slot
  const renderDragHandle = (
    <DragHandle
      listeners={dragHandleProps?.listeners}
      attributes={dragHandleProps?.attributes}
      disabled={isOverlay}
    />
  );

  return (
    <div ref={setDroppableNodeRef}>
      <ItemWrapper
        isOverlay={isOverlay}
        dragHandle={renderDragHandle}
        actions={renderActions}
        className={cn(
          "ml-4",
          isQuizOver ? "bg-blue-50 outline outline-1 outline-blue-500/50" : "",
        )}
      >
        <button
          onClick={() => onToggleExpand(topic._id)}
          className="mr-2 text-muted-foreground hover:text-foreground"
          aria-expanded={isExpanded}
          aria-controls={`topic-content-${topic._id}`}
          disabled={isOverlay}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
        {/* <EditableTitle
          as="h4"
          className="flex-grow text-sm font-semibold"
          initialTitle={topic.title}
          onSave={(newTitle) => _changeTopicTitle(topic._id, newTitle)}
          disabled={isOverlay}
        /> */}
        {/* Temporary replacement for EditableTitle */}
        <h4 className="flex-grow text-sm font-semibold">{topic.title}</h4>
      </ItemWrapper>
    </div>
  );
};
