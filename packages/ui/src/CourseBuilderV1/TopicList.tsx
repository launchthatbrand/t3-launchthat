import React, { useCallback, useState } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useConfig } from "@payloadcms/ui";

import { AddTopicButton } from "./AddTopicButton";
import { SortableTopic } from "./SortableTopic";

type TopicType = {
  id: string;
  title: string;
  order: number;
  status: string;
  quizzes?: QuizType[];
};

type QuizType = {
  id: string;
  title: string;
  status: string;
};

type TopicListProps = {
  topics: TopicType[];
  lessonId: string;
  onAddTopic: () => void;
  onTitleChange: (topicId: string, newTitle: string) => Promise<void>;
  onAddQuiz: (topicId: string) => Promise<void>;
  onQuizTitleChange: (quizId: string, newTitle: string) => Promise<void>;
  expandedItems: Record<string, boolean>;
  onToggleExpand: (type: "topic", itemId: string) => void;
};

export const TopicList: React.FC<TopicListProps> = ({
  topics,
  lessonId,
  onAddTopic,
  onTitleChange,
  onAddQuiz,
  onQuizTitleChange,
  expandedItems,
  onToggleExpand,
}) => {
  const [topicItems, setTopicItems] = useState<TopicType[]>(topics);
  const config = useConfig();

  // Find topics collection slug from config
  const topicsCollection = getTopicsCollectionSlug(config);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setTopicItems((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);

          return arrayMove(items, oldIndex, newIndex);
        });

        // Update orders in the database
        const updatedTopics = arrayMove(
          [...topicItems],
          topicItems.findIndex((item) => item.id === active.id),
          topicItems.findIndex((item) => item.id === over.id),
        ).map((topic, index) => ({
          id: topic.id,
          order: index,
        }));

        try {
          // Update all topics with new order in a batch
          await Promise.all(
            updatedTopics.map(async (topic) => {
              await fetch(`/api/${topicsCollection}/${topic.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  order: topic.order,
                }),
              });
            }),
          );
        } catch (error) {
          console.error("Error updating topic order:", error);
        }
      }
    },
    [topicItems, topicsCollection],
  );

  if (topics.length === 0) {
    return (
      <div className="topic-list-empty">
        <p>No topics in this lesson yet.</p>
        <AddTopicButton onClick={onAddTopic} />
      </div>
    );
  }

  return (
    <div className="topic-list">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={topicItems.map((topic) => topic.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="topic-list-items">
            {topicItems.map((topic) => (
              <SortableTopic
                key={topic.id}
                topic={topic}
                isExpanded={expandedItems[`topic-${topic.id}`] || false}
                onToggleExpand={() => onToggleExpand("topic", topic.id)}
                onTitleChange={(newTitle) => onTitleChange(topic.id, newTitle)}
                onAddQuiz={() => onAddQuiz(topic.id)}
                onQuizTitleChange={onQuizTitleChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="topic-list-actions">
        <AddTopicButton onClick={onAddTopic} />
      </div>
    </div>
  );
};

// Helper function to get the topics collection slug from config
function getTopicsCollectionSlug(config: any): string {
  // Default value
  let topicsCollection = "lms-topics";

  try {
    // Try to find the LMS plugin in the config
    if (config?.plugins) {
      for (const plugin of config.plugins) {
        // Look for the lmsPlugin by checking options
        if (
          plugin?.name === "lms-plugin" ||
          plugin?.options?.topicsCollection ||
          plugin?.options?.collectionsPrefix === "lms"
        ) {
          // Get the topics collection from options or use default with prefix
          topicsCollection =
            plugin.options?.topicsCollection ||
            `${plugin.options?.collectionsPrefix || "lms"}-topics` ||
            "lms-topics";
          break;
        }
      }
    }

    // Fallback: check collections directly
    if (config?.collections) {
      const collections = config.collections.map((c: any) => c.slug);

      // Check for common naming patterns
      const topicCollectionCandidates = ["topics", "lms-topics", "lmsTopics"];

      for (const candidate of topicCollectionCandidates) {
        if (collections.includes(candidate)) {
          topicsCollection = candidate;
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error detecting topics collection:", error);
  }

  return topicsCollection;
}
