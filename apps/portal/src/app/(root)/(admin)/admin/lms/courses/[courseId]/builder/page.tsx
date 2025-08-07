"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { Active, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AvailableItemSelector } from "@/components/AvailableItemSelector";
import { BuilderDndProvider } from "@/components/BuilderDndProvider";
import { CourseStructureDropzone } from "@/components/CourseStructureDropzone";
import { CreateLessonDialog } from "@/components/CreateLessonDialog";
import { CreateQuizDialog } from "@/components/CreateQuizDialog"; // New import
import { CreateTopicDialog } from "@/components/CreateTopicDialog"; // New import

import { LessonCard } from "@/components/LessonCard";
import { SortableItem } from "@/components/SortableItem";
import { SortableList } from "@/components/SortableList";
import { Button } from "@/components/ui/button";
import { api } from "@convex-config/_generated/api";
import { DragOverlay } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMutation, useQuery } from "convex/react";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

// Define these type interfaces here, as they are specific to this page's Dnd implementation
interface TopicDropzoneData {
  type: "topicDropzone";
  lessonId: Id<"lessons">;
}
interface QuizDropzoneData {
  type: "quizDropzone";
  lessonId: Id<"lessons">;
}
interface DraggedItemData {
  type: string;
  item: Doc<"lessons"> | Doc<"topics"> | Doc<"quizzes">;
}

type ActiveCurrentData = DraggedItemData | TopicDropzoneData | QuizDropzoneData;

// Forms for topic and quiz creation
// Moved inside CourseBuilder component

interface CourseStructureItem {
  lessonId: Id<"lessons">;
}

export default function CourseBuilder() {
  const params = useParams();
  const courseId = params.courseId as Id<"courses"> | undefined;

  // Course Data
  const courseData = useQuery(
    api.lms.courses.queries.getCourseStructureWithItems,
    courseId ? { courseId } : "skip",
  );

  // Available Items
  const availableLessons = useQuery(
    api.lms.courses.queries.getAvailableLessons,
    courseId ? {} : "skip",
  );
  const availableTopics = useQuery(
    api.lms.courses.queries.getAvailableTopics,
    courseId ? {} : "skip",
  );
  const availableQuizzes = useQuery(
    api.lms.courses.queries.getAvailableQuizzes,
    courseId ? {} : "skip",
  );

  // Mutations
  const addLessonToCourse = useMutation(
    api.lms.courses.mutations.addLessonToCourse,
  );
  const removeLessonFromCourseStructure = useMutation(
    api.lms.courses.mutations.removeLessonFromCourseStructure,
  );
  const reorderLessonsInCourse = useMutation(
    api.lms.courses.mutations.reorderLessonsInCourse,
  );
  const createTopic = useMutation(api.lms.topics.mutations.create);
  const attachTopicToLesson = useMutation(
    api.lms.topics.mutations.attachToLesson,
  );
  const removeTopicFromLesson = useMutation(
    api.lms.topics.mutations.removeTopicFromLesson,
  );
  const createQuiz = useMutation(api.lms.quizzes.mutations.create);
  const attachQuizToLesson = useMutation(api.lms.quizzes.mutations.attach);
  const removeQuizFromLesson = useMutation(
    api.lms.quizzes.mutations.removeQuizFromLesson,
  );
  const reorderTopicsInLesson = useMutation(
    api.lms.topics.mutations.reorderTopicsInLesson,
  );

  const [selectedLesson, setSelectedLesson] = useState<Id<"lessons"> | null>(
    null,
  );

  // Track expanded/collapsed lessons
  const [expandedLessons, setExpandedLessons] = useState<Id<"lessons">[]>([]);
  const [lessonTopicSortOrder, setLessonTopicSortOrder] = useState<
    Record<Id<"lessons">, "alphabetical" | "date">
  >({});

  const toggleLessonExpand = (lessonId: Id<"lessons">) => {
    setExpandedLessons((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId],
    );
  };

  const _topicsForLesson = useMemo(() => {
    if (!courseData?.attachedTopics || !selectedLesson) return []; // Ensure courseData is defined
    return courseData.attachedTopics.filter(
      (t) => t.lessonId === selectedLesson,
    );
  }, [selectedLesson, courseData?.attachedTopics]); // Depend on courseData.attachedTopics

  // computed sorted topics is done inline where needed to avoid unused var

  const _quizzesForLesson = useMemo(() => {
    if (!courseData?.attachedQuizzes || !selectedLesson) return [];
    return courseData.attachedQuizzes.filter(
      (q) => q.lessonId === selectedLesson,
    );
  }, [selectedLesson, courseData?.attachedQuizzes]);

  const [activeItem, setActiveItem] = useState<Active | null>(null);

  const activeDragItem = useMemo(() => {
    if (!activeItem) return null;
    const data = activeItem.data.current;

    const typedData = data as DraggedItemData;

    switch (typedData.type) {
      case "lesson":
      case "availableLesson":
        return (
          courseData?.attachedLessons.find((l) => l._id === activeItem.id) ??
          availableLessons?.find((l) => l._id === activeItem.id)
        );
      case "topic":
      case "availableTopic":
        return (
          courseData?.attachedTopics.find((t) => t._id === activeItem.id) ??
          availableTopics?.find((t) => t._id === activeItem.id)
        );
      case "quiz":
      case "availableQuiz":
        return (
          courseData?.attachedQuizzes.find((q) => q._id === activeItem.id) ??
          availableQuizzes?.find((q) => q._id === activeItem.id)
        );
      default:
        return null;
    }
  }, [
    activeItem,
    courseData,
    availableLessons,
    availableTopics,
    availableQuizzes,
  ]);

  const activeDragItemType = activeItem?.data.current?.type as
    | string
    | undefined;

  // Early returns for loading/error states
  if (!courseId) {
    return <div>Loading course ID...</div>;
  }

  if (
    courseData === undefined ||
    availableLessons === undefined ||
    availableTopics === undefined ||
    availableQuizzes === undefined
  ) {
    return <div>Loading course data...</div>;
  }

  if (courseData === null) {
    return <div>Course not found.</div>;
  }

  const lessonsInCourseStructure: (Doc<"lessons"> & { type: "lesson" })[] = (
    (courseData.course.courseStructure ?? []) as CourseStructureItem[]
  )
    .map((structureItem) => {
      const lesson = courseData.attachedLessons.find(
        (l) => l._id === structureItem.lessonId,
      );
      return lesson ? { ...lesson, type: "lesson" as const } : null;
    })
    .filter(
      (item): item is Doc<"lessons"> & { type: "lesson" } => item !== null,
    );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveItem(null);
      return;
    }

    const activeData = active.data.current as ActiveCurrentData;
    const overData = over.data.current as ActiveCurrentData;

    const activeType = activeData.type;
    const activeId = active.id as Id<"lessons" | "topics" | "quizzes">;
    const overType = overData.type;
    const overId = over.id as Id<"lessons" | "topics" | "quizzes">;

    // Type guards for dropzone data
    const isTopicDropzoneData = (
      data: ActiveCurrentData,
    ): data is TopicDropzoneData => {
      return data.type === "topicDropzone";
    };

    const isQuizDropzoneData = (
      data: ActiveCurrentData,
    ): data is QuizDropzoneData => {
      return data.type === "quizDropzone";
    };

    // Handle reordering lessons within the course structure
    if (activeType === "lesson" && overType === "lesson") {
      const oldIndex = lessonsInCourseStructure.findIndex(
        (item) => item._id === activeId,
      );
      const newIndex = lessonsInCourseStructure.findIndex(
        (item) => item._id === overId,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(
          lessonsInCourseStructure.map((item) => ({ lessonId: item._id })),
          oldIndex,
          newIndex,
        ).map((item) => item.lessonId);

        try {
          await reorderLessonsInCourse({
            courseId,
            orderedLessonIds: newOrder,
          });
          toast.success("Lessons reordered!");
        } catch (error: unknown) {
          // Explicitly type error as unknown
          console.error(
            "Failed to reorder lessons:",
            error instanceof Error ? error.message : String(error),
          ); // Safely access error message
          toast.error("Failed to reorder lessons.");
        }
      }
    }

    // Handle adding available lesson to course structure
    if (
      activeType === "availableLesson" &&
      overId === "course-structure-droppable"
    ) {
      try {
        await addLessonToCourse({
          courseId,
          lessonId: activeId as Id<"lessons">,
        });
        toast.success("Lesson added to course structure!");
      } catch (error: unknown) {
        console.error(
          "Failed to add lesson to course:",
          error instanceof Error ? error.message : String(error),
        );
        toast.error("Failed to add lesson to course.");
      }
    }

    // Handle adding available topic to a lesson via TopicDropzone
    if (activeType === "availableTopic" && isTopicDropzoneData(overData)) {
      try {
        await attachTopicToLesson({
          lessonId: overData.lessonId,
          topicId: activeId as Id<"topics">,
          order: 0,
        });
        toast.success("Topic attached to lesson!");
      } catch (error: unknown) {
        console.error(
          "Failed to attach topic to lesson:",
          error instanceof Error ? error.message : String(error),
        );
        toast.error("Failed to attach topic to lesson.");
      }
    }

    // Handle adding available quiz to a lesson via QuizDropzone
    if (activeType === "availableQuiz" && isQuizDropzoneData(overData)) {
      try {
        await attachQuizToLesson({
          lessonId: overData.lessonId,
          quizId: activeId as Id<"quizzes">,
          order: 0,
          isFinal: false,
        });
        toast.success("Quiz attached to lesson!");
      } catch (error: unknown) {
        console.error(
          "Failed to attach quiz to lesson:",
          error instanceof Error ? error.message : String(error),
        );
        toast.error("Failed to attach quiz to lesson.");
      }
    }

    // ────────────────────────────────
    // Handle reordering topics *within the same lesson* via drag-and-drop
    // ────────────────────────────────
    if (activeType === "topic" && overType === "topic") {
      const activeTopic = activeData.item as Doc<"topics">;
      const overTopic = overData.item as Doc<"topics">;

      // Only reorder if both topics belong to the same lesson
      if (activeTopic.lessonId && activeTopic.lessonId === overTopic.lessonId) {
        const lessonId = activeTopic.lessonId;

        // Build current ordered list for that lesson (as seen in UI)
        const currentTopics = courseData.attachedTopics
          .filter((t) => t.lessonId === lessonId)
          .sort(
            (a, b) =>
              (a.menuOrder ?? a.order ?? 0) - (b.menuOrder ?? b.order ?? 0),
          );

        const oldIndex = currentTopics.findIndex((t) => t._id === activeId);
        const newIndex = currentTopics.findIndex((t) => t._id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newOrder = arrayMove(currentTopics, oldIndex, newIndex).map(
            (t) => t._id,
          );

          try {
            await reorderTopicsInLesson({
              lessonId,
              orderedTopicIds: newOrder,
            });
            toast.success("Topics reordered!");
          } catch (error: unknown) {
            console.error(
              "Failed to reorder topics:",
              error instanceof Error ? error.message : String(error),
            );
            toast.error("Failed to reorder topics.");
          }
        }
      }
    }

    setActiveItem(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };

  const handleNewTopicSubmit = async (
    values: z.infer<typeof createTopicSchema>,
  ) => {
    // This function is now handled by CreateTopicDialog internally
    // The logic below is no longer used, but kept for reference if needed
    console.warn("handleNewTopicSubmit in builder/page.tsx is deprecated.");
    try {
      const newTopicId = await createTopic(values);
      if (selectedLesson) {
        await attachTopicToLesson({
          lessonId: selectedLesson,
          topicId: newTopicId,
          order: 0,
        });
      }
      toast.success("Topic created!");
    } catch (error: unknown) {
      console.error(
        "Failed to create topic:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to create topic.");
    }
  };

  const handleNewQuizSubmit = async (
    values: z.infer<typeof createQuizSchema>,
  ) => {
    // This function is now handled by CreateQuizDialog internally
    // The logic below is no longer used, but kept for reference if needed
    console.warn("handleNewQuizSubmit in builder/page.tsx is deprecated.");
    try {
      const newQuizId = await createQuiz({
        title: values.title,
        questions: [],
      });
      if (selectedLesson) {
        await attachQuizToLesson({
          lessonId: selectedLesson,
          quizId: newQuizId,
          order: 0,
          isFinal: false,
        });
      }
      toast.success("Quiz created!");
    } catch (error: unknown) {
      console.error(
        "Failed to create quiz:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to create quiz.");
    }
  };

  const _handleAddLessonToCourse = async (lessonId: Id<"lessons">) => {
    if (!courseId) return;
    try {
      await addLessonToCourse({ courseId, lessonId });
      toast.success("Lesson added to course structure!");
    } catch (error: unknown) {
      console.error(
        "Failed to add lesson to course:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to add lesson to course.");
    }
  };

  const handleRemoveLessonFromCourse = async (lessonId: Id<"lessons">) => {
    if (!courseId) return;
    try {
      await removeLessonFromCourseStructure({ courseId, lessonId });
      toast.success("Lesson removed from course structure!");
    } catch (error: unknown) {
      console.error(
        "Failed to remove lesson from course:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to remove lesson from course.");
    }
  };

  const handleRemoveTopicFromLesson = async (topicId: Id<"topics">) => {
    try {
      await removeTopicFromLesson({ topicId });
      toast.success("Topic removed from lesson!");
    } catch (error: unknown) {
      console.error(
        "Failed to remove topic from lesson:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to remove topic from lesson.");
    }
  };

  const handleRemoveQuizFromLesson = async (quizId: Id<"quizzes">) => {
    try {
      await removeQuizFromLesson({ quizId });
      toast.success("Quiz removed from lesson!");
    } catch (error: unknown) {
      console.error(
        "Failed to remove quiz from lesson:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to remove quiz from lesson.");
    }
  };

  return (
    <BuilderDndProvider
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Course Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Course: {courseData.course.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Description: {courseData.course.description}</p>
          <p>Published: {courseData.course.isPublished ? "Yes" : "No"}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column: Course Structure */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Course Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <SortableList
                items={lessonsInCourseStructure}
                type="lesson"
                renderItem={(lesson) => {
                  // These topicsForLesson and quizzesForLesson are correctly scoped within the map loop
                  const topicsForLesson = courseData.attachedTopics.filter(
                    (t) => t.lessonId === lesson._id,
                  );
                  const quizzesForLesson = courseData.attachedQuizzes.filter(
                    (q) => q.lessonId === lesson._id,
                  );

                  return (
                    <LessonCard
                      lesson={lesson}
                      topics={topicsForLesson}
                      quizzes={quizzesForLesson}
                      topicSortOrder={
                        lessonTopicSortOrder[lesson._id] ?? "alphabetical"
                      }
                      onToggleSortOrder={async () => {
                        const newSortOrder =
                          (lessonTopicSortOrder[lesson._id] ??
                            "alphabetical") === "alphabetical"
                            ? "date"
                            : "alphabetical";

                        // compute sorted topics according to newSortOrder
                        const sorted = [...topicsForLesson].sort((a, b) => {
                          if (newSortOrder === "alphabetical") {
                            return a.title.localeCompare(b.title);
                          }
                          return a._creationTime - b._creationTime;
                        });

                        await reorderTopicsInLesson({
                          lessonId: lesson._id,
                          orderedTopicIds: sorted.map((t) => t._id),
                        });

                        setLessonTopicSortOrder((prev) => ({
                          ...prev,
                          [lesson._id]: newSortOrder,
                        }));
                      }}
                      onRemoveLesson={handleRemoveLessonFromCourse}
                      onRemoveTopic={handleRemoveTopicFromLesson}
                      onRemoveQuiz={handleRemoveQuizFromLesson}
                      lessonExpanded={expandedLessons.includes(lesson._id)}
                      onToggleExpand={toggleLessonExpand}
                    />
                  );
                }}
              />
              {lessonsInCourseStructure.length === 0 && (
                <CourseStructureDropzone id="course-structure-droppable">
                  <p className="text-sm text-muted-foreground">
                    Drag available lessons here to add them to the course
                    structure.
                  </p>
                </CourseStructureDropzone>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Available Items and Creation Forms */}
        <div>
          {/* Lesson Selector */}
          <AvailableItemSelector
            title="Lessons"
            items={availableLessons}
            searchPlaceholder="Search lesson..."
            label={(l) => l.title}
            newItemTrigger={
              <CreateLessonDialog
                courseId={courseId}
                onCreate={(id) => {
                  setSelectedLesson(id);
                  return Promise.resolve();
                }}
              />
            }
            onSelect={(lesson) => {
              setSelectedLesson(lesson._id);
              toast.success("Lesson selected");
            }}
          />

          <Separator className="my-6" />

          {/* Topic Selector */}
          <AvailableItemSelector
            title="Topics"
            items={availableTopics}
            searchPlaceholder="Search topic..."
            label={(t) => t.title}
            newItemTrigger={
              <CreateTopicDialog
                lessonId={selectedLesson || undefined} // Pass selected lesson if available
                onCreate={(id) => {
                  toast.success("New topic created.");
                  // Optionally set selected topic, or refresh list
                }}
              />
            }
            onSelect={(topic) => {
              // This is for selecting an existing topic to reorder/attach
              setSelectedLesson(topic.lessonId || null); // Assuming topics have a lessonId
              toast.success("Topic selected");
            }}
          />

          <Separator className="my-6" />

          {/* Quiz Selector */}
          <AvailableItemSelector
            title="Quizzes"
            items={availableQuizzes}
            searchPlaceholder="Search quiz..."
            label={(q) => q.title}
            newItemTrigger={
              <CreateQuizDialog
                lessonId={selectedLesson || undefined} // Pass selected lesson if available
                onCreate={(id) => {
                  toast.success("New quiz created.");
                  // Optionally set selected quiz, or refresh list
                }}
              />
            }
            onSelect={(quiz) => {
              // This is for selecting an existing quiz to reorder/attach
              setSelectedLesson(quiz.lessonId || null); // Assuming quizzes have a lessonId
              toast.success("Quiz selected");
            }}
          />
        </div>
      </div>
      <DragOverlay>
        {activeItem && activeDragItem ? (
          <SortableItem
            id={activeItem.id.toString()}
            data={activeItem.data.current as DraggedItemData}
            isOverlayDragging={true}
          >
            <div className="rounded-md bg-background p-4 opacity-80 shadow-lg">
              <h4 className="text-lg font-semibold">
                {activeDragItemType === "lesson" ||
                activeDragItemType === "availableLesson"
                  ? (activeDragItem as Doc<"lessons">).title
                  : activeDragItemType === "topic" ||
                      activeDragItemType === "availableTopic"
                    ? (activeDragItem as Doc<"topics">).title
                    : activeDragItemType === "quiz" ||
                        activeDragItemType === "availableQuiz"
                      ? (activeDragItem as Doc<"quizzes">).title
                      : ""}
              </h4>
            </div>
          </SortableItem>
        ) : null}
      </DragOverlay>
    </BuilderDndProvider>
  );
}
