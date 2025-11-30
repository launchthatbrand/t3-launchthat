// Expect Lesson/Quiz union for main items
import type { Active } from "@dnd-kit/core";
import React from "react";

import { DragOverlayPreview } from "@acme/dnd";
import { cn } from "@acme/ui";

import type { Lesson, Quiz } from "../store/useCourseBuilderStore";
import type { LessonItem, QuizItem, TopicItem } from "../types/content";

type OverlaySourceItem = { id: string; title?: string; type?: string };

interface DragOverlayContentProps {
  activeItem: Active | null;
  mainContentItems: (Lesson | Quiz)[];
  availableLessons: LessonItem[];
  availableTopics: TopicItem[];
  availableQuizzes: QuizItem[];
}

const baseClass =
  "rounded border bg-card px-3 py-2 text-sm shadow-lg cursor-grabbing";
const quizBaseClass =
  "rounded border bg-card px-2 py-1 text-xs shadow-lg cursor-grabbing";

const typeAccentClasses: Record<string, string> = {
  lesson: "border-blue-500",
  topic: "border-green-500",
  quiz: "border-yellow-500",
};

const DragOverlayContent: React.FC<DragOverlayContentProps> = ({
  activeItem,
  mainContentItems,
  availableLessons,
  availableTopics,
  availableQuizzes,
}) => {
  const resolveItem = React.useCallback(
    (active: Active) => {
      const activeId = String(active.id);
      const activeType = active.data.current?.type as string | undefined;

      const source =
        (mainContentItems.find((item) => item.id === activeId) as
          | OverlaySourceItem
          | undefined) ??
        (availableLessons.find((item) => item.id === activeId) as
          | OverlaySourceItem
          | undefined) ??
        (availableTopics.find((item) => item.id === activeId) as
          | OverlaySourceItem
          | undefined) ??
        (availableQuizzes.find((item) => item.id === activeId) as
          | OverlaySourceItem
          | undefined);

      if (!source) {
        return null;
      }

      const displayType = source.type ?? activeType;
      const label = source.title ?? "Untitled item";

      return {
        id: source.id,
        label,
        type: displayType,
      };
    },
    [availableLessons, availableQuizzes, availableTopics, mainContentItems],
  );

  const fallback = activeItem ? (
    <div className="bg-destructive text-destructive-foreground rounded border px-3 py-2 text-sm shadow-lg">
      Unknown item
    </div>
  ) : null;

  return (
    <DragOverlayPreview
      active={activeItem}
      resolveItem={resolveItem}
      fallback={fallback}
      renderItem={(item) => {
        const displayType = item.type ?? "lesson";
        const accentClass = typeAccentClasses[displayType] ?? "";
        const sizeClass = displayType === "quiz" ? quizBaseClass : baseClass;

        return <div className={cn(sizeClass, accentClass)}>{item.label}</div>;
      }}
    />
  );
};

export default DragOverlayContent;
