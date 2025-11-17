"use client";

import "./index.css"; // Assuming these CSS files exist or styles are handled by Tailwind
import "./styles.css";

import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation as _useMutation, useQuery } from "convex/react";
import { GripVertical, PlusCircle, Trash2 } from "lucide-react";

// --- UI Imports (Using standard Shadcn from @acme/ui) --- //
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";

import type { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";

// --- Types --- //
type TopicData = Doc<"topics">;
type LessonData = Doc<"lessons"> & { topics?: TopicData[] };

// --- Component Props --- //
interface CourseBuilderProps {
  courseId: Id<"courses">;
}

// --- Sortable Item Component (Keep this helper) --- //
interface SortableItemProps {
  id: UniqueIdentifier;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// --- Main Component --- //
export function CourseBuilder({ courseId }: CourseBuilderProps) {
  // --- State --- //
  const [courseTitle, setCourseTitle] = useState<string>("Loading course...");
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // --- Data Fetching & Derived State --- //
  const courseStructure = useQuery(api.courses.getCourseStructure, {
    courseId,
  });
  const lessonIds = useMemo(
    () => lessons.map((l) => `lesson-${l._id}`),
    [lessons],
  );

  // --- Active Item State for DragOverlay --- //
  const activeLesson = useMemo(() => {
    if (
      !activeId ||
      typeof activeId !== "string" ||
      !activeId.startsWith("lesson-")
    )
      return null;
    return lessons.find((l) => `lesson-${l._id}` === activeId);
  }, [activeId, lessons]);

  const activeTopic = useMemo(() => {
    if (
      !activeId ||
      typeof activeId !== "string" ||
      !activeId.startsWith("topic-")
    )
      return null;
    for (const lesson of lessons) {
      const topic = (lesson.topics ?? []).find(
        (t) => `topic-${t._id}` === activeId,
      );
      if (topic) return topic;
    }
    return null;
  }, [activeId, lessons]);

  // --- Update State based on Fetched Data --- //
  useEffect(() => {
    if (courseStructure) {
      setCourseTitle(courseStructure.title);
      const formattedLessons = (courseStructure.lessons ?? []).map(
        (lesson) => ({
          ...lesson,
          topics: lesson.topics ?? [],
        }),
      );
      setLessons(formattedLessons);
    } else if (courseStructure === null) {
      setCourseTitle("Course Not Found");
      setLessons([]);
    } else {
      setCourseTitle("Loading course...");
      setLessons([]);
    }
  }, [courseStructure]);

  // --- Dnd Setup --- //
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- Dnd Handlers (Keeping improved logic) --- //
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Potential future use
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active || active.id === over.id) return;

    const activeIdString = active.id as string;
    const overIdString = over.id as string;
    const [activeType] = activeIdString.split("-") as [string, string];

    setLessons((currentLessons) => {
      let updatedLessons = [...currentLessons];

      if (activeType === "lesson") {
        const oldIndex = updatedLessons.findIndex(
          (l) => `lesson-${l._id}` === activeIdString,
        );
        const newIndex = updatedLessons.findIndex(
          (l) => `lesson-${l._id}` === overIdString,
        );
        if (oldIndex !== -1 && newIndex !== -1) {
          updatedLessons = arrayMove(updatedLessons, oldIndex, newIndex);
          console.log("Reordered lessons (client):");
          // TODO: Convex mutation for lesson order
          return updatedLessons;
        }
      } else if (activeType === "topic") {
        let sourceLessonIndex = -1,
          sourceTopicIndex = -1;
        let targetLessonIndex = -1,
          targetTopicIndex = -1;

        // Find source
        for (let i = 0; i < updatedLessons.length; i++) {
          const lesson = updatedLessons[i];
          if (!lesson) continue; // Check lesson first
          const topics = lesson.topics ?? []; // Restore ?? []
          const idx = topics.findIndex(
            (t) => `topic-${t._id}` === activeIdString,
          );
          if (idx !== -1) {
            sourceLessonIndex = i;
            sourceTopicIndex = idx;
            break;
          }
        }

        // Find target
        for (let i = 0; i < updatedLessons.length; i++) {
          const lesson = updatedLessons[i];
          if (!lesson) continue; // Safety check
          const topics = lesson.topics ?? []; // Restore ?? []
          const idx = topics.findIndex(
            (t) => `topic-${t._id}` === overIdString,
          );
          if (idx !== -1) {
            targetLessonIndex = i;
            targetTopicIndex = idx;
            break;
          }
          if (`lesson-${lesson._id}` === overIdString) {
            targetLessonIndex = i;
            targetTopicIndex = topics.length;
            break;
          }
        }

        // Handle Reordering
        if (sourceLessonIndex !== -1 && targetLessonIndex !== -1) {
          const sourceLesson = updatedLessons[sourceLessonIndex];
          const targetLesson = updatedLessons[targetLessonIndex];
          // Ensure both lessons exist before proceeding
          if (sourceLesson && targetLesson) {
            const topicToMove = sourceLesson.topics[sourceTopicIndex];
            // Now check if topics arrays exist and topicToMove is valid
            if (topicToMove && sourceLesson.topics && targetLesson.topics) {
              // Same Lesson Reorder
              if (
                sourceLessonIndex === targetLessonIndex &&
                targetLesson.topics
              ) {
                const reorderedTopics = arrayMove(
                  targetLesson.topics,
                  sourceTopicIndex,
                  targetTopicIndex,
                );
                updatedLessons[targetLessonIndex] = {
                  ...targetLesson,
                  topics: reorderedTopics,
                };
                console.log(
                  `Reordered topics in lesson ${targetLesson._id} (client):`,
                );
                // TODO: Convex mutation for topic order
              } else if (targetLesson.topics) {
                // Different Lesson Move
                console.log(
                  `Moving topic ${topicToMove._id} from lesson ${sourceLesson._id} to ${targetLesson._id} (client):`,
                );
                updatedLessons[sourceLessonIndex] = {
                  ...sourceLesson,
                  topics: sourceLesson.topics.filter(
                    (_, index) => index !== sourceTopicIndex,
                  ),
                };
                updatedLessons[targetLessonIndex] = {
                  ...targetLesson,
                  topics: [
                    ...targetLesson.topics.slice(0, targetTopicIndex),
                    topicToMove,
                    ...targetLesson.topics.slice(targetTopicIndex),
                  ],
                };
                // TODO: Convex mutations for topic order in BOTH lessons
              }
              return updatedLessons;
            }
          }
        }
      }
      return currentLessons; // Return original if no valid move
    });
  }, []);

  // --- Other Handlers (Placeholder for mutations) --- //
  const handleAddLesson = useCallback(() => {
    console.log("Add Lesson Clicked (TODO: Implement Convex mutation)");
  }, []);

  const handleAddTopic = useCallback((lessonId: Id<"lessons">) => {
    console.log(
      `Add Topic to ${lessonId} Clicked (TODO: Implement Convex mutation)`,
    );
  }, []);

  const _handleTitleChange = useCallback(
    (
      _itemType: string, // Keep placeholders for now
      _itemId: Id<"lessons"> | Id<"topics">,
      _newTitle: string,
    ) => {
      console.log(`Update title (TODO: Implement Convex mutation)`);
    },
    [],
  );

  const handleRemoveItem = useCallback(
    (_itemType: string, _itemId: Id<"lessons"> | Id<"topics">) => {
      console.log(`Remove item (TODO: Implement Convex mutation)`);
    },
    [],
  );

  // --- Render Logic (Restoring Card structure) --- //
  if (courseStructure === undefined) {
    return <div className="p-6 text-center">Loading Course Builder...</div>;
  }
  if (courseStructure === null) {
    return (
      <div className="p-6 text-red-500">
        Course not found or failed to load.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <div className="p-6">
        {/* Course Title Input (Keep) */}
        <Input
          type="text"
          placeholder="Course Title"
          value={courseTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCourseTitle(e.target.value)
          } // TODO: Debounce & Mutate
          className="mb-6 text-xl font-semibold"
        />

        <SortableContext
          items={lessonIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const topicIds = (lesson.topics ?? []).map(
                (t) => `topic-${t._id}`,
              );
              return (
                // Wrap Card with SortableItem
                <SortableItem
                  key={`lesson-${lesson._id}`}
                  id={`lesson-${lesson._id}`}
                >
                  <Card className="overflow-hidden bg-muted/50">
                    <CardHeader className="flex cursor-grab flex-row items-center justify-between space-y-0 bg-slate-100 p-3 pb-2 dark:bg-slate-800">
                      <CardTitle className="flex items-center gap-2 text-lg font-medium">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        {/* TODO: Inline editable title? */}
                        {lesson.title}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem("lesson", lesson._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3">
                      {/* TODO: Inline editable description? */}
                      <Textarea
                        placeholder="Lesson description..."
                        defaultValue={lesson.description}
                        className="mb-4"
                      />
                      {/* Nested Sortable Context for Topics */}
                      <SortableContext
                        items={topicIds}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="ml-4 space-y-2 border-l-2 pl-4 dark:border-gray-700">
                          {(lesson.topics ?? []).map((topic) => (
                            // Wrap Topic Card with SortableItem
                            <SortableItem
                              key={`topic-${topic._id}`}
                              id={`topic-${topic._id}`}
                            >
                              <Card className="overflow-hidden bg-background">
                                <CardHeader className="flex cursor-grab flex-row items-center justify-between space-y-0 bg-slate-50 px-3 py-2 dark:bg-slate-700">
                                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    {/* TODO: Inline editable title? */}
                                    {topic.title}
                                  </CardTitle>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleRemoveItem("topic", topic._id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </CardHeader>
                                {/* TODO: Add topic content based on type */}
                              </Card>
                            </SortableItem>
                          ))}
                          {/* Add Topic Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTopic(lesson._id)}
                            className="mt-2"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Topic
                          </Button>
                        </div>
                      </SortableContext>
                    </CardContent>
                  </Card>
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>

        {/* Add Lesson Button */}
        <Button onClick={handleAddLesson} className="mt-6">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Lesson
        </Button>

        {/* Drag Overlay (Keep simplified Card rendering) */}
        <DragOverlay>
          {activeId ? (
            activeLesson ? (
              <Card className="bg-muted/50 opacity-75 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-slate-100 p-3 pb-2 dark:bg-slate-800">
                  <CardTitle className="flex items-center gap-2 text-lg font-medium">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    {activeLesson.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            ) : activeTopic ? (
              <Card className="bg-background opacity-75 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-slate-50 px-3 py-2 dark:bg-slate-700">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {activeTopic.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            ) : null
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

// CSS classes assumed from ./index.css and ./styles.css or Tailwind:
// course-builder, relative, w-full, p-0, mb-6, text-xl, font-semibold,
// lessons-list, mb-8, flex, flex-col, gap-4, topics-list, ml-8, mt-2,
// border-l, border-gray-200, pl-4, dark:border-gray-700, drag-overlay
