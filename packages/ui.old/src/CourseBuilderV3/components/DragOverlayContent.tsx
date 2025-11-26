// Expect Lesson/Quiz union for main items
import type { Active } from "@dnd-kit/core";
import React from "react";

import { cn } from "@acme/ui";

import type { Lesson, Quiz } from "../store/useCourseBuilderStore";
import type { LessonItem, QuizItem, TopicItem } from "../types/content";

interface DragOverlayContentProps {
  activeItem: Active | null;
  // Replace lessons/finalQuizzes with mainContentItems
  // lessons: Lesson[];
  // finalQuizzes: Quiz[];
  mainContentItems: (Lesson | Quiz)[]; // Unified array for structured items
  availableLessons: LessonItem[];
  availableTopics: TopicItem[];
  availableQuizzes: QuizItem[];
}

const DragOverlayContent: React.FC<DragOverlayContentProps> = ({
  activeItem,
  // Destructure mainContentItems
  mainContentItems,
  availableLessons,
  availableTopics,
  availableQuizzes,
}) => {
  if (!activeItem) return null;

  const activeId = activeItem.id;
  const activeType = activeItem.data.current?.type as string | undefined;

  // Use const for itemData
  const itemData: { id: string; title: string; type?: string } | undefined = // Add optional type
    mainContentItems.find((item) => item.id === activeId) ??
    availableLessons.find((item) => item.id === activeId) ??
    availableTopics.find((item) => item.id === activeId) ?? // Topics might be dragged from sidebar
    availableQuizzes.find((item) => item.id === activeId);

  let className =
    "rounded border bg-card p-2 text-sm shadow-lg cursor-grabbing"; // Base style
  let specificTypeClass = "";

  // Determine styling based on the found item's type or the active drag type
  const displayType = itemData?.type ?? activeType;

  switch (displayType) {
    case "lesson":
      specificTypeClass = "border-blue-500";
      break;
    case "topic":
      specificTypeClass = "border-green-500";
      break;
    case "quiz":
      specificTypeClass = "border-yellow-500 text-xs";
      className =
        "rounded border bg-card p-1 text-xs shadow-lg cursor-grabbing"; // Smaller for quiz
      break;
    default:
      // Render unknown type if itemData exists but has no type (shouldn't happen with current types)
      // or if activeType was unknown and itemData wasn't found.
      return (
        <div
          className={cn(
            className,
            "bg-destructive text-destructive-foreground",
          )}
        >
          {itemData ? itemData.title : "Unknown Item"}
        </div>
      );
  }

  if (!itemData) return null; // Item not found in any list

  // Render the item representation
  return (
    <div className={cn(className, specificTypeClass)}>{itemData.title}</div>
  );
};

export default DragOverlayContent;
