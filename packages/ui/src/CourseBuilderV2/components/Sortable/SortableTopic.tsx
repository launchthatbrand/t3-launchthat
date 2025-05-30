import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Id } from "../../../../apps/wsa/convex/_generated/dataModel";
import type { DraggableItemData, Quiz, TopicWithQuizzes } from "../types"; // Corrected path

import { TopicItem } from "../Item/TopicItem"; // Corrected path

// --- Prop Types ---
interface SortableTopicProps {
  topic: TopicWithQuizzes;
  lessonId: Id<"lessons">;
  isExpanded: boolean;
  activeDragData: DraggableItemData | null;
  onToggleExpand: (topicId: Id<"topics">) => void;
  onAddQuiz: (topicId: Id<"topics">, order: number) => Promise<void>;
  onRemoveTopic: (topicId: Id<"topics">) => void;
  onTitleChangeTopic: (topicId: Id<"topics">, newTitle: string) => void;
  renderQuizItem: (quiz: Quiz) => React.ReactNode;
}

export const SortableTopic: React.FC<SortableTopicProps> = ({
  topic,
  lessonId,
  isExpanded,
  activeDragData,
  onToggleExpand,
  onAddQuiz,
  onRemoveTopic,
  onTitleChangeTopic,
  renderQuizItem,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `topic-${topic._id}`,
    data: {
      type: "topic",
      item: topic,
      parentId: lessonId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Combine listeners and attributes for the drag handle prop
  const dragHandleProps: {
    listeners?: DraggableSyntheticListeners;
    attributes?: DraggableAttributes;
  } = { listeners, attributes };

  return (
    // Apply ref and style to the outer div, but NOT listeners/attributes
    <div ref={setNodeRef} style={style}>
      <TopicItem
        topic={topic}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onAddQuiz={onAddQuiz}
        onTitleChange={onTitleChangeTopic}
        onRemove={onRemoveTopic}
        isOverlay={isDragging}
        dragHandleProps={dragHandleProps} // Pass combined listeners/attributes
        renderQuizItem={renderQuizItem} // Pass the prop down
        activeDragData={activeDragData} // Pass the prop down
      />
      {/* Quiz rendering is now handled internally by TopicItem via renderQuizItem */}
    </div>
  );
};
