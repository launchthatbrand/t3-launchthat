import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { Doc, Id } from "../../../../apps/wsa/convex/_generated/dataModel"; // Adjust path

import { SortableTopic } from "./SortableTopic";

// Assuming TopicWithQuizzes type is defined elsewhere
type TopicWithQuizzes = Doc<"topics"> & { quizzes?: Doc<"quizzes">[] };

interface TopicListProps {
  lessonId: Id<"lessons">; // ID of the parent lesson
  topics: TopicWithQuizzes[];
  expandedTopicStates: Record<string, boolean>;
  onToggleTopicExpand: (itemId: string) => void;
  onAddQuiz: (topicId: Id<"topics">) => void;
  onTitleChange: (
    itemType: "lesson" | "topic" | "quiz",
    itemId: string,
    newTitle: string,
  ) => void;
  onRemoveItem: (itemType: "lesson" | "topic" | "quiz", itemId: string) => void;
}

export const TopicList: React.FC<TopicListProps> = ({
  lessonId: _lessonId,
  topics,
  expandedTopicStates,
  onToggleTopicExpand,
  onAddQuiz,
  onTitleChange,
  onRemoveItem,
}) => {
  // Generate IDs for sortable context, prefixing with lesson ID might be safer if topics could move between lessons
  const sortableTopicIds = topics.map((topic) => `topic-${topic._id}`);

  return (
    <SortableContext
      items={sortableTopicIds}
      strategy={verticalListSortingStrategy}
    >
      <div className="space-y-1.5">
        {topics.map((topic) => (
          <SortableTopic
            key={topic._id}
            topic={topic}
            isExpanded={expandedTopicStates[`topic-${topic._id}`] ?? false}
            onToggleExpand={onToggleTopicExpand}
            onAddQuiz={onAddQuiz}
            onTitleChange={onTitleChange}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
    </SortableContext>
  );
};
