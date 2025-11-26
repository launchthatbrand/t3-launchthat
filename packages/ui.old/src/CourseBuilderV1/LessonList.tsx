import React from "react";
import type {
  DragEndEvent} from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
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

import { SortableLesson } from "./SortableLesson";

// Define types to match SortableLesson component
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

interface LessonType {
  id: string;
  title: string;
  order: number;
  status: string;
  topics?: TopicType[];
}

interface LessonListProps {
  lessons: LessonType[];
  onReorder: (lessons: LessonType[]) => void;
  onRemove: (lessonId: string) => void;
  onAddTopic: (lessonId: string) => void;
  onTitleChange: (lessonId: string, newTitle: string) => Promise<void>;
  onAddQuiz: (topicId: string) => Promise<void>;
  onTopicTitleChange: (topicId: string, newTitle: string) => Promise<void>;
  onQuizTitleChange: (quizId: string, newTitle: string) => Promise<void>;
  expandedItems: Record<string, boolean>;
  onToggleExpand: (type: "lesson" | "topic", itemId: string) => void;
  lessonsCollection: string;
}

const LessonList: React.FC<LessonListProps> = ({
  lessons,
  onReorder,
  onRemove,
  onAddTopic,
  onTitleChange,
  onAddQuiz,
  onTopicTitleChange,
  onQuizTitleChange,
  expandedItems,
  onToggleExpand,
  lessonsCollection,
}) => {
  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((lesson) => lesson.id === active.id);
      const newIndex = lessons.findIndex((lesson) => lesson.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedLessons = arrayMove([...lessons], oldIndex, newIndex);

        // Update the order property for each lesson
        const updatedLessons = reorderedLessons.map((lesson, index) => ({
          ...lesson,
          order: index,
        }));

        onReorder(updatedLessons);
      }
    }
  };

  if (lessons.length === 0) {
    return (
      <div className="lesson-list-empty">
        No lessons added yet. Click "Add Lesson" to create your first lesson.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={lessons.map((lesson) => lesson.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="lesson-list">
          {lessons.map((lesson) => (
            <SortableLesson
              key={lesson.id}
              lesson={lesson}
              isExpanded={expandedItems[`lesson-${lesson.id}`] || false}
              onToggleExpand={() => onToggleExpand("lesson", lesson.id)}
              onAddTopic={() => onAddTopic(lesson.id)}
              onTitleChange={(newTitle) => onTitleChange(lesson.id, newTitle)}
              onAddQuiz={onAddQuiz}
              onTopicTitleChange={onTopicTitleChange}
              onQuizTitleChange={onQuizTitleChange}
              expandedTopics={expandedItems}
              onToggleTopicExpand={(topicId) =>
                onToggleExpand("topic", topicId)
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default LessonList;
