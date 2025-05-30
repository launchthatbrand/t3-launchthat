import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useConfig } from "@payloadcms/ui";

import { AddTopicButton } from "./AddTopicButton";
import { DropZone } from "./DropZone";
import { LessonItem } from "./LessonItem";
import { SortableTopic } from "./SortableTopic";

type LessonType = {
  id: string;
  title: string;
  order: number;
  status: string;
  topics?: TopicType[];
};

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

type SortableLessonProps = {
  lesson: LessonType;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddTopic: () => void;
  onTitleChange: (newTitle: string) => Promise<void>;
  onAddQuiz: (topicId: string) => Promise<void>;
  onTopicTitleChange: (topicId: string, newTitle: string) => Promise<void>;
  onQuizTitleChange: (quizId: string, newTitle: string) => Promise<void>;
  expandedTopics: Record<string, boolean>;
  onToggleTopicExpand: (topicId: string) => void;
};

export const SortableLesson: React.FC<SortableLessonProps> = ({
  lesson,
  isExpanded,
  onToggleExpand,
  onAddTopic,
  onTitleChange,
  onAddQuiz,
  onTopicTitleChange,
  onQuizTitleChange,
  expandedTopics,
  onToggleTopicExpand,
}) => {
  const config = useConfig();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `lesson-${lesson.id}`,
    data: {
      type: "lesson",
      lesson,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div className="sortable-lesson-wrapper" ref={setNodeRef} style={style}>
      <LessonItem
        title={lesson.title}
        status={lesson.status}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onTitleChange={onTitleChange}
        topicCount={lesson.topics?.length || 0}
      />

      {isExpanded && (
        <div className="lesson-content ml-8 mt-2 space-y-2">
          {/* Sortable Topics List */}
          {lesson.topics && lesson.topics.length > 0 ? (
            <div className="topics-list space-y-2">
              {lesson.topics.map((topic) => (
                <SortableTopic
                  key={topic.id}
                  topic={topic}
                  isExpanded={expandedTopics[`topic-${topic.id}`] || false}
                  onToggleExpand={() => onToggleTopicExpand(topic.id)}
                  onTitleChange={(newTitle) =>
                    onTopicTitleChange(topic.id, newTitle)
                  }
                  onAddQuiz={() => onAddQuiz(topic.id)}
                  onQuizTitleChange={onQuizTitleChange}
                />
              ))}
            </div>
          ) : (
            <DropZone
              message="No topics yet. Add a topic to get started."
              className="mx-2 mb-2"
            />
          )}

          <AddTopicButton onClick={onAddTopic} />
        </div>
      )}
    </div>
  );
};

// Helper function to get the lessons collection slug from config
function getLessonsCollectionSlug(config: any): string {
  // Default value
  let lessonsCollection = "lms-lessons";

  try {
    // Try to find the LMS plugin in the config
    if (config?.plugins) {
      for (const plugin of config.plugins) {
        // Look for the lmsPlugin by checking options
        if (
          plugin?.name === "lms-plugin" ||
          plugin?.options?.lessonsCollection ||
          plugin?.options?.collectionsPrefix === "lms"
        ) {
          // Get the lesson collection from options or use default with prefix
          lessonsCollection =
            plugin.options?.lessonsCollection ||
            `${plugin.options?.collectionsPrefix || "lms"}-lessons` ||
            "lms-lessons";
          break;
        }
      }
    }

    // Fallback: check collections directly
    if (config?.collections) {
      const collections = config.collections.map((c: any) => c.slug);

      // Check for common naming patterns
      const lessonCollectionCandidates = [
        "lessons",
        "lms-lessons",
        "lmsLessons",
      ];

      for (const candidate of lessonCollectionCandidates) {
        if (collections.includes(candidate)) {
          lessonsCollection = candidate;
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error detecting lessons collection:", error);
  }

  return lessonsCollection;
}
