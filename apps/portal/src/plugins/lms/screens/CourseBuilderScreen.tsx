"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import type { Active, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import React, { useMemo, useState } from "react";
import { BuilderDndProvider } from "@/components/BuilderDndProvider";
import { CourseStructureDropzone } from "@/components/CourseStructureDropzone";
import { LessonCard } from "@/components/LessonCard";
import { SortableItem } from "@/components/SortableItem";
import { SortableList } from "@/components/SortableList";
import { Button } from "@/components/ui/button";
import { api } from "@convex-config/_generated/api";
import { DragOverlay } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMutation, useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
  LmsCourseStructureItem,
} from "~/plugins/lms/types";
import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

interface CourseBuilderScreenProps {
  courseId?: Id<"posts">;
}

interface TopicDropzoneData {
  type: "topicDropzone";
  lessonId: Id<"posts">;
}

interface QuizDropzoneData {
  type: "quizDropzone";
  lessonId: Id<"posts">;
}

type DraggedItem =
  | { type: "lesson" | "availableLesson"; item: LmsBuilderLesson }
  | { type: "topic" | "availableTopic"; item: LmsBuilderTopic }
  | { type: "quiz" | "availableQuiz"; item: LmsBuilderQuiz };

type ActiveCurrentData = DraggedItem | TopicDropzoneData | QuizDropzoneData;

export function CourseBuilderScreen({ courseId }: CourseBuilderScreenProps) {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);

  const courseData = useQuery(
    api.plugins.lms.queries.getCourseStructureWithItems,
    courseId
      ? ({ courseId, organizationId: organizationId ?? undefined } as {
          courseId: Id<"posts">;
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsCourseBuilderData | null | undefined;

  const availableLessons = useQuery(
    api.plugins.lms.queries.getAvailableLessons,
    courseId
      ? ({ courseId, organizationId: organizationId ?? undefined } as {
          courseId: Id<"posts">;
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsBuilderLesson[] | undefined;
  const availableTopics = useQuery(
    api.plugins.lms.queries.getAvailableTopics,
    courseId
      ? ({ organizationId: organizationId ?? undefined } as {
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsBuilderTopic[] | undefined;
  const availableQuizzes = useQuery(
    api.plugins.lms.queries.getAvailableQuizzes,
    courseId
      ? ({ organizationId: organizationId ?? undefined } as {
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsBuilderQuiz[] | undefined;

  const addLessonToCourse = useMutation(
    api.plugins.lms.mutations.addLessonToCourse,
  );
  const removeLessonFromCourseStructure = useMutation(
    api.plugins.lms.mutations.removeLessonFromCourseStructure,
  );
  const reorderLessonsInCourse = useMutation(
    api.plugins.lms.mutations.reorderLessonsInCourse,
  );
  const attachTopicToLesson = useMutation(
    api.plugins.lms.mutations.attachTopicToLesson,
  );
  const removeTopicFromLesson = useMutation(
    api.plugins.lms.mutations.removeTopicFromLesson,
  );
  const reorderTopicsInLesson = useMutation(
    api.plugins.lms.mutations.reorderTopicsInLesson,
  );
  const attachQuizToLesson = useMutation(
    api.plugins.lms.mutations.attachQuizToLesson,
  );
  const removeQuizFromLesson = useMutation(
    api.plugins.lms.mutations.removeQuizFromLesson,
  );

  const [lessonTopicSortOrder, setLessonTopicSortOrder] = useState<
    Record<string, "alphabetical" | "date">
  >({});
  const [activeItem, setActiveItem] = useState<Active | null>(null);

  const lessonsInCourseStructure: LmsBuilderLesson[] = useMemo(() => {
    if (!courseData) return [];
    const map = new Map(
      courseData.attachedLessons.map(
        (lesson: LmsBuilderLesson) => [lesson._id, lesson] as const,
      ),
    );
    return (courseData.course.courseStructure ?? [])
      .map((item: LmsCourseStructureItem) => map.get(item.lessonId))
      .filter((lesson): lesson is LmsBuilderLesson => Boolean(lesson));
  }, [courseData]);

  const topicsByLesson = useMemo(() => {
    const bucket = new Map<Id<"posts">, LmsBuilderTopic[]>();
    (courseData?.attachedTopics ?? []).forEach((topic: LmsBuilderTopic) => {
      if (!topic.lessonId) return;
      const current = bucket.get(topic.lessonId) ?? [];
      current.push(topic);
      bucket.set(topic.lessonId, current);
    });
    return bucket;
  }, [courseData?.attachedTopics]);

  const quizzesByLesson = useMemo(() => {
    const bucket = new Map<Id<"posts">, LmsBuilderQuiz[]>();
    (courseData?.attachedQuizzes ?? []).forEach((quiz: LmsBuilderQuiz) => {
      if (!quiz.lessonId) return;
      const current = bucket.get(quiz.lessonId) ?? [];
      current.push(quiz);
      bucket.set(quiz.lessonId, current);
    });
    return bucket;
  }, [courseData?.attachedQuizzes]);

  const activeDragItem = useMemo(() => {
    if (!activeItem) return null;
    const data = activeItem.data.current as ActiveCurrentData;
    switch (data.type) {
      case "lesson":
      case "availableLesson":
        return (
          lessonsInCourseStructure.find(
            (lesson: LmsBuilderLesson) => lesson._id === activeItem.id,
          ) ??
          (availableLessons ?? []).find(
            (lesson: LmsBuilderLesson) => lesson._id === activeItem.id,
          )
        );
      case "topic":
      case "availableTopic":
        return (
          (courseData?.attachedTopics ?? []).find(
            (topic: LmsBuilderTopic) => topic._id === activeItem.id,
          ) ??
          (availableTopics ?? []).find(
            (topic: LmsBuilderTopic) => topic._id === activeItem.id,
          )
        );
      case "quiz":
      case "availableQuiz":
        return (
          (courseData?.attachedQuizzes ?? []).find(
            (quiz: LmsBuilderQuiz) => quiz._id === activeItem.id,
          ) ??
          (availableQuizzes ?? []).find(
            (quiz: LmsBuilderQuiz) => quiz._id === activeItem.id,
          )
        );
      default:
        return null;
    }
  }, [
    activeItem,
    availableLessons,
    availableTopics,
    availableQuizzes,
    courseData?.attachedQuizzes,
    courseData?.attachedTopics,
    lessonsInCourseStructure,
  ]);

  const handleDragStart = (event: DragStartEvent) =>
    setActiveItem(event.active);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveItem(null);
      return;
    }

    const overData = over.data.current as ActiveCurrentData;
    const activeData = active.data.current as ActiveCurrentData;

    if (activeData.type === "lesson" && overData.type === "lesson") {
      const oldIndex = lessonsInCourseStructure.findIndex(
        (lesson) => lesson._id === active.id,
      );
      const newIndex = lessonsInCourseStructure.findIndex(
        (lesson) => lesson._id === over.id,
      );
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newOrder = arrayMove(
          lessonsInCourseStructure.map((lesson) => lesson._id),
          oldIndex,
          newIndex,
        );
        try {
          await reorderLessonsInCourse({
            courseId: courseId as Id<"posts">,
            orderedLessonIds: newOrder,
          });
          toast.success("Lessons reordered!");
        } catch (error) {
          console.error(error);
          toast.error("Failed to reorder lessons.");
        }
      }
    }

    if (
      activeData.type === "availableLesson" &&
      over.id === "course-structure-droppable"
    ) {
      try {
        await addLessonToCourse({
          courseId: courseId as Id<"posts">,
          lessonId: active.id as Id<"posts">,
        });
        toast.success("Lesson added to course!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to add lesson.");
      }
    }

    if (
      activeData.type === "availableTopic" &&
      overData.type === "topicDropzone"
    ) {
      try {
        await attachTopicToLesson({
          lessonId: overData.lessonId,
          topicId: active.id as Id<"posts">,
          order: 0,
        });
        toast.success("Topic attached.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to attach topic.");
      }
    }

    if (
      activeData.type === "availableQuiz" &&
      overData.type === "quizDropzone"
    ) {
      try {
        await attachQuizToLesson({
          lessonId: overData.lessonId,
          quizId: active.id as Id<"posts">,
          order: 0,
          isFinal: false,
        });
        toast.success("Quiz attached.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to attach quiz.");
      }
    }

    if (activeData.type === "topic" && overData.type === "topic") {
      const lessonId = activeData.item.lessonId;
      if (lessonId && lessonId === overData.item.lessonId) {
        const topics = topicsByLesson.get(lessonId) ?? [];
        const oldIndex = topics.findIndex((topic) => topic._id === active.id);
        const newIndex = topics.findIndex((topic) => topic._id === over.id);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newOrder = arrayMove(
            topics.map((topic) => topic._id),
            oldIndex,
            newIndex,
          );
          try {
            await reorderTopicsInLesson({
              lessonId,
              orderedTopicIds: newOrder,
            });
            toast.success("Topics reordered!");
          } catch (error) {
            console.error(error);
            toast.error("Failed to reorder topics.");
          }
        }
      }
    }

    setActiveItem(null);
  };

  const handleDragCancel = () => setActiveItem(null);

  const handleRemoveLesson = async (lessonId: Id<"posts">) => {
    try {
      await removeLessonFromCourseStructure({
        courseId: courseId as Id<"posts">,
        lessonId,
      });
      toast.success("Lesson removed.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove lesson.");
    }
  };

  const handleTopicRemoval = async (topicId: Id<"posts">) => {
    try {
      await removeTopicFromLesson({ topicId });
      toast.success("Topic removed.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove topic.");
    }
  };

  const handleQuizRemoval = async (quizId: Id<"posts">) => {
    try {
      await removeQuizFromLesson({ quizId });
      toast.success("Quiz removed.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove quiz.");
    }
  };

  const handleLessonTopicSortChange = (
    lessonId: Id<"posts">,
    sortOrder: "alphabetical" | "date",
  ) => {
    const key = lessonId as string;
    setLessonTopicSortOrder((prev) => ({ ...prev, [key]: sortOrder }));
  };

  if (!courseId) {
    return (
      <div className="rounded-md border p-6 text-sm text-muted-foreground">
        Save your course first to access the builder.
      </div>
    );
  }

  if (
    courseData === undefined ||
    availableLessons === undefined ||
    availableTopics === undefined ||
    availableQuizzes === undefined
  ) {
    return <div>Loading course data…</div>;
  }

  if (courseData === null) {
    return <div>Course not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course outline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <BuilderDndProvider
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-4">
                <CourseStructureDropzone id="course-structure-droppable">
                  {lessonsInCourseStructure.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Drag lessons from the right to start building your course.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Drag available lessons here to append them to the end of
                      the structure.
                    </p>
                  )}
                </CourseStructureDropzone>
                <SortableList
                  items={lessonsInCourseStructure}
                  type="lesson"
                  renderItem={(lesson) => {
                    const lessonKey = lesson._id as string;
                    const currentSort =
                      lessonTopicSortOrder[lessonKey] ?? "alphabetical";
                    return (
                      <SortableItem
                        key={lesson._id}
                        id={lesson._id}
                        data={{ type: "lesson", item: lesson }}
                      >
                        <LessonCard
                          lesson={lesson}
                          topics={topicsByLesson.get(lesson._id) ?? []}
                          quizzes={quizzesByLesson.get(lesson._id) ?? []}
                          topicSortOrder={currentSort}
                          onToggleSortOrder={(lessonId) =>
                            handleLessonTopicSortChange(
                              lessonId,
                              currentSort === "alphabetical"
                                ? "date"
                                : "alphabetical",
                            )
                          }
                          onRemoveLesson={handleRemoveLesson}
                          onRemoveTopic={handleTopicRemoval}
                          onRemoveQuiz={handleQuizRemoval}
                        />
                      </SortableItem>
                    );
                  }}
                />
              </div>
              <div className="space-y-6">
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Available Lessons</h4>
                    <p className="text-xs text-muted-foreground">
                      Drag onto the canvas or click Add.
                    </p>
                  </div>
                  <div className="rounded-lg border">
                    <SortableList
                      items={availableLessons ?? []}
                      type="availableLesson"
                      renderItem={(lesson) => (
                        <div className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {lesson.title}
                            </p>
                            {lesson.slug ? (
                              <p className="truncate text-xs text-muted-foreground">
                                /{lesson.slug}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={async (event) => {
                              event.stopPropagation();
                              if (!courseId) return;
                              try {
                                await addLessonToCourse({
                                  courseId: courseId as Id<"posts">,
                                  lessonId: lesson._id,
                                });
                                toast.success("Lesson added to course.");
                              } catch (error) {
                                console.error(error);
                                toast.error("Failed to add lesson.");
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      )}
                    />
                    {availableLessons === undefined && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        Loading lessons…
                      </div>
                    )}
                    {availableLessons?.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No additional lessons found.
                      </div>
                    )}
                  </div>
                </section>

                <Separator />

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Topics Library</h4>
                    <p className="text-xs text-muted-foreground">
                      Drag a topic into a lesson dropzone.
                    </p>
                  </div>
                  <div className="rounded-lg border">
                    <SortableList
                      items={availableTopics ?? []}
                      type="availableTopic"
                      renderItem={(topic) => (
                        <div className="px-3 py-2">
                          <p className="truncate text-sm font-medium">
                            {topic.title}
                          </p>
                          {topic.lessonId ? (
                            <p className="text-xs text-muted-foreground">
                              Linked to lesson
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Unassigned
                            </p>
                          )}
                        </div>
                      )}
                    />
                    {availableTopics === undefined && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        Loading topics…
                      </div>
                    )}
                    {availableTopics?.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No topics ready yet.
                      </div>
                    )}
                  </div>
                </section>

                <Separator />

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Quizzes Library</h4>
                    <p className="text-xs text-muted-foreground">
                      Drag onto a lesson to attach.
                    </p>
                  </div>
                  <div className="rounded-lg border">
                    <SortableList
                      items={availableQuizzes ?? []}
                      type="availableQuiz"
                      renderItem={(quiz) => (
                        <div className="px-3 py-2">
                          <p className="truncate text-sm font-medium">
                            {quiz.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {quiz.isFinal ? "Final quiz" : "Lesson quiz"}
                          </p>
                        </div>
                      )}
                    />
                    {availableQuizzes === undefined && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        Loading quizzes…
                      </div>
                    )}
                    {availableQuizzes?.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No quizzes ready yet.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
            <DragOverlay dropAnimation={null}>
              {activeDragItem ? (
                <Button
                  variant="ghost"
                  className="pointer-events-none opacity-80"
                >
                  {activeDragItem.title ?? "Dragging…"}
                </Button>
              ) : null}
            </DragOverlay>
          </BuilderDndProvider>
        </CardContent>
      </Card>
    </div>
  );
}
