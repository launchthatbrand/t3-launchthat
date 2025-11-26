import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useConfig } from "@payloadcms/ui";

import { AddQuizButton } from "./AddQuizButton";
import { DropZone } from "./DropZone";
import { SortableQuiz } from "./SortableQuiz";
import { TopicItem } from "./TopicItem";

interface TopicType {
  id: string;
  title: string;
  order: number;
  status: string;
  quizzes?: QuizType[];
}

interface QuizType {
  id: string;
  title: string;
  status: string;
}

interface SortableTopicProps {
  topic: TopicType;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTitleChange: (newTitle: string) => Promise<void>;
  onAddQuiz: () => Promise<void>;
  onQuizTitleChange: (quizId: string, newTitle: string) => Promise<void>;
}

export const SortableTopic: React.FC<SortableTopicProps> = ({
  topic,
  isExpanded,
  onToggleExpand,
  onTitleChange,
  onAddQuiz,
  onQuizTitleChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `topic-${topic.id}`,
    data: {
      type: "topic",
      topic,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div className="sortable-topic-wrapper" ref={setNodeRef} style={style}>
      <TopicItem
        title={topic.title}
        status={topic.status}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onTitleChange={onTitleChange}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        quizCount={topic.quizzes?.length || 0}
      />

      {isExpanded && (
        <div className="topic-content ml-8 mt-2 space-y-2">
          {/* Sortable Quizzes List */}
          {topic.quizzes && topic.quizzes.length > 0 ? (
            <div className="quizzes-list space-y-2">
              {topic.quizzes.map((quiz) => (
                <SortableQuiz
                  key={quiz.id}
                  quiz={quiz}
                  onTitleChange={(newTitle) =>
                    onQuizTitleChange(quiz.id, newTitle)
                  }
                  parentType="topic"
                />
              ))}
            </div>
          ) : (
            <DropZone
              message="No quizzes yet. Add a quiz to get started."
              className="mx-2 mb-2"
            />
          )}

          <AddQuizButton onClick={onAddQuiz} parentType="topic" />
        </div>
      )}
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
