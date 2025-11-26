"use client";

import "./index.css";
import "./styles.css";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import React, { useCallback, useEffect, useState } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAllFormFields, useConfig, useDocumentInfo } from "@payloadcms/ui";
import { AdminViewClientProps, AdminViewServerProps } from "payload";
import { reduceFieldsToValues } from "payload/shared";

import AddLessonButton from "./AddLessonButton";
import { DropZone } from "./DropZone";
import { LessonItem } from "./LessonItem";
import { QuizItem } from "./QuizItem";
import { SectionHeading } from "./SectionHeading";
import { SortableLesson } from "./SortableLesson";
import { TopicItem } from "./TopicItem";

// Types for the course builder
interface LessonType {
  id: string;
  title: string;
  order: number;
  status: string;
  topics?: TopicType[];
}

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

interface CourseType {
  id: string;
  title: string;
  lessons?: LessonType[];
}

type DragItemType = "lesson" | "topic" | "quiz";

// Define the type for collection slugs
// interface CollectionSlugs {
//   courses: string;
//   lessons: string;
//   topics: string;
//   quizzes: string;
// }

// interface CourseBuilderProps {
//   collectionSlugs?: CollectionSlugs;
// }

const CourseBuilder = ({ slugs }: { slugs: any }) => {
  console.log("slugs", slugs);
  const { id } = useDocumentInfo();
  const { getEntityConfig } = useConfig();
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<DragItemType | null>(null);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  // Use collection slugs from props with fallback to default values
  const lessonsCollection = slugs.lessonsCollection || "lessons";
  const topicsCollection = slugs.topicsCollection || "topics";
  const quizzesCollection = slugs.quizzesCollection || "quizzes";

  console.log("Using collection slugs:", {
    lessonsCollection,
    topicsCollection,
    quizzesCollection,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const fetchLessons = async () => {
      if (!id) return;

      try {
        setLoading(true);
        console.log(
          `Fetching lessons for course ${id} from collection "${lessonsCollection}"`,
        );

        // Fetch lessons related to this course
        const url = `/api/${lessonsCollection}?where[course][equals]=${id}&depth=2`;
        console.log("API request URL:", url);

        const lessonsResponse = await fetch(url);

        if (!lessonsResponse.ok) {
          const errorData = await lessonsResponse.json().catch(() => ({}));
          console.error("Error response:", lessonsResponse.status, errorData);
          throw new Error(
            `Failed to fetch lessons: ${lessonsResponse.status} ${lessonsResponse.statusText}`,
          );
        }

        const lessonsData = await lessonsResponse.json();
        console.log(
          `Fetched ${lessonsData?.docs?.length || 0} lessons:`,
          lessonsData,
        );

        if (lessonsData?.docs) {
          // Sort lessons by order
          const sortedLessons = [...lessonsData.docs].sort(
            (a, b) => a.order - b.order,
          );

          // Ensure all fields match our LessonType
          const mappedLessons = sortedLessons.map((lesson) => ({
            ...lesson,
            // Use status if available, otherwise fallback to _status
            status: lesson.status || lesson._status || "draft",
            // Initialize expanded state for each lesson
            topics: (lesson.topics || []).map((topic: any) => ({
              ...topic,
              status: topic.status || topic._status || "draft",
            })),
          }));

          setLessons(mappedLessons);

          // Initialize expanded state for all items
          const initialExpandedState: Record<string, boolean> = {};
          mappedLessons.forEach((lesson) => {
            initialExpandedState[`lesson-${lesson.id}`] = false;
            (lesson.topics || []).forEach((topic: TopicType) => {
              initialExpandedState[`topic-${topic.id}`] = false;
            });
          });
          setExpandedItems(initialExpandedState);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load course data. Please try again.",
        );
        setLoading(false);
      }
    };

    fetchLessons();
  }, [id, lessonsCollection]);

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const idString = active.id as string;
      setActiveId(idString);

      // Parse the ID to get type and actual ID
      const [type, itemId] = idString.split("-");
      setActiveType(type as DragItemType);

      // Find the dragged item
      if (type === "lesson") {
        const draggedItem = lessons.find((item) => item.id === itemId);
        setActiveItem(draggedItem);
      } else if (type === "topic") {
        // Find the topic in all lessons
        for (const lesson of lessons) {
          const topic = lesson.topics?.find((t) => t.id === itemId);
          if (topic) {
            setActiveItem(topic);
            break;
          }
        }
      } else if (type === "quiz") {
        // Find the quiz in all topics
        for (const lesson of lessons) {
          for (const topic of lesson.topics || []) {
            const quiz = topic.quizzes?.find((q) => q.id === itemId);
            if (quiz) {
              setActiveItem(quiz);
              break;
            }
          }
        }
      }
    },
    [lessons],
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        setActiveId(null);
        setActiveType(null);
        setActiveItem(null);
        return;
      }

      const activeIdString = active.id as string;
      const overIdString = over.id as string;

      if (activeIdString === overIdString) {
        setActiveId(null);
        setActiveType(null);
        setActiveItem(null);
        return;
      }

      const [activeType, activeItemId] = activeIdString.split("-");
      const [overType, overItemId] = overIdString.split("-");

      if (activeType === "lesson" && overType === "lesson") {
        // Reorder lessons
        setLessons((items) => {
          const oldIndex = items.findIndex((item) => item.id === activeItemId);
          const newIndex = items.findIndex((item) => item.id === overItemId);
          return arrayMove(items, oldIndex, newIndex);
        });

        // Update orders in the database
        const updatedLessons = arrayMove(
          [...lessons],
          lessons.findIndex((item) => item.id === activeItemId),
          lessons.findIndex((item) => item.id === overItemId),
        ).map((lesson, index) => ({
          id: lesson.id,
          order: index,
        }));

        try {
          // Update all lessons with new order in a batch
          await Promise.all(
            updatedLessons.map(async (lesson) => {
              await fetch(`/api/${lessonsCollection}/${lesson.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  order: lesson.order,
                }),
              });
            }),
          );
        } catch (error) {
          console.error("Error updating lesson order:", error);
        }
      }
      // Add handling for topic and quiz reordering and movement here

      setActiveId(null);
      setActiveType(null);
      setActiveItem(null);
    },
    [lessons, lessonsCollection],
  );

  const handleAddLesson = async () => {
    if (!id) return;

    try {
      // Create a new lesson linked to this course
      const highestOrder =
        lessons.length > 0
          ? Math.max(...lessons.map((lesson) => lesson.order || 0))
          : -1;

      const newLessonData = {
        title: "New Lesson",
        course: id,
        order: highestOrder + 1,
        content: {}, // Add content field with empty object for richText
        status: "draft", // Changed from _status to status
      };

      console.log("Creating new lesson with data:", newLessonData);
      console.log("Posting to:", `/api/${lessonsCollection}`);

      const response = await fetch(`/api/${lessonsCollection}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLessonData),
        credentials: "include",
      });

      if (response.ok) {
        const newLesson = await response.json();
        console.log("New lesson created:", newLesson);

        // Ensure the new lesson has the required status field
        const lessonWithStatus = {
          ...newLesson,
          status: newLesson.status || newLesson._status || "draft",
          topics: [],
        };

        setLessons([...lessons, lessonWithStatus]);
        // Auto-expand the new lesson
        setExpandedItems((prev) => ({
          ...prev,
          [`lesson-${newLesson.id}`]: true,
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error adding lesson:", response.status, errorData);
        setError(
          `Failed to add lesson: ${response.status} ${response.statusText}. ${errorData.errors?.[0]?.message || ""}`,
        );
      }
    } catch (err) {
      console.error("Error adding lesson:", err);
      setError(
        `Failed to add lesson: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  // Handle adding a topic to a lesson
  const handleAddTopic = async (lessonId: string) => {
    console.log(`Adding topic to lesson ${lessonId}`);

    try {
      // Find the lesson to get its highest topic order
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return;

      const highestOrder =
        lesson.topics && lesson.topics.length > 0
          ? Math.max(...lesson.topics.map((topic) => topic.order || 0))
          : -1;

      const newTopicData = {
        title: "New Topic",
        lesson: lessonId,
        order: highestOrder + 1,
        content: {}, // Add content field with empty object for richText
        status: "draft",
      };

      const response = await fetch(`/api/${topicsCollection}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTopicData),
        credentials: "include",
      });

      if (response.ok) {
        const newTopic = await response.json();
        console.log("New topic created:", newTopic);

        // Update the lessons state
        setLessons(
          lessons.map((lesson) => {
            if (lesson.id === lessonId) {
              return {
                ...lesson,
                topics: [
                  ...(lesson.topics || []),
                  {
                    ...newTopic,
                    status: newTopic.status || newTopic._status || "draft",
                    quizzes: [],
                  },
                ],
              };
            }
            return lesson;
          }),
        );

        // Auto-expand the new topic
        setExpandedItems((prev) => ({
          ...prev,
          [`topic-${newTopic.id}`]: true,
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error adding topic:", response.status, errorData);
        setError(
          `Failed to add topic: ${response.status} ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error("Error adding topic:", err);
      setError(
        `Failed to add topic: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  // Handle adding a quiz to a topic
  const handleAddQuiz = async (topicId: string) => {
    console.log(`Adding quiz to topic ${topicId}`);

    try {
      const newQuizData = {
        title: "New Quiz",
        passing_percentage: 70,
        status: "draft",
      };

      const response = await fetch(`/api/${quizzesCollection}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newQuizData),
        credentials: "include",
      });

      if (response.ok) {
        const newQuiz = await response.json();
        console.log("New quiz created:", newQuiz);

        // Associate the quiz with the topic
        await fetch(`/api/${topicsCollection}/${topicId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quiz: newQuiz.id,
          }),
          credentials: "include",
        });

        // Update the lessons state
        setLessons(
          lessons.map((lesson) => {
            if (!lesson.topics) return lesson;

            const updatedTopics = lesson.topics.map((topic) => {
              if (topic.id === topicId) {
                return {
                  ...topic,
                  quizzes: [
                    ...(topic.quizzes || []),
                    {
                      ...newQuiz,
                      status: newQuiz.status || newQuiz._status || "draft",
                    },
                  ],
                };
              }
              return topic;
            });

            return {
              ...lesson,
              topics: updatedTopics,
            };
          }),
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error adding quiz:", response.status, errorData);
        setError(
          `Failed to add quiz: ${response.status} ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error("Error adding quiz:", err);
      setError(
        `Failed to add quiz: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleToggleExpand = (itemType: "lesson" | "topic", itemId: string) => {
    const key = `${itemType}-${itemId}`;
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTitleChange = async (
    itemType: "lesson" | "topic" | "quiz",
    itemId: string,
    newTitle: string,
  ) => {
    let endpoint = "";

    switch (itemType) {
      case "lesson":
        endpoint = `${lessonsCollection}/${itemId}`;
        break;
      case "topic":
        endpoint = `${topicsCollection}/${itemId}`;
        break;
      case "quiz":
        endpoint = `${quizzesCollection}/${itemId}`;
        break;
    }

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
        credentials: "include",
      });

      if (response.ok) {
        // Update the local state
        if (itemType === "lesson") {
          setLessons(
            lessons.map((lesson) =>
              lesson.id === itemId ? { ...lesson, title: newTitle } : lesson,
            ),
          );
        } else if (itemType === "topic") {
          setLessons(
            lessons.map((lesson) => {
              if (!lesson.topics) return lesson;

              const updatedTopics = lesson.topics.map((topic) =>
                topic.id === itemId ? { ...topic, title: newTitle } : topic,
              );

              return {
                ...lesson,
                topics: updatedTopics,
              };
            }),
          );
        } else if (itemType === "quiz") {
          setLessons(
            lessons.map((lesson) => {
              if (!lesson.topics) return lesson;

              const updatedTopics = lesson.topics.map((topic) => {
                if (!topic.quizzes) return topic;

                const updatedQuizzes = topic.quizzes.map((quiz) =>
                  quiz.id === itemId ? { ...quiz, title: newTitle } : quiz,
                );

                return {
                  ...topic,
                  quizzes: updatedQuizzes,
                };
              });

              return {
                ...lesson,
                topics: updatedTopics,
              };
            }),
          );
        }
      } else {
        console.error(`Error updating ${itemType} title:`, response.status);
      }
    } catch (err) {
      console.error(`Error updating ${itemType} title:`, err);
    }
  };

  const handleRemoveLesson = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/${lessonsCollection}/${lessonId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setLessons(lessons.filter((lesson) => lesson.id !== lessonId));
      } else {
        setError("Failed to remove lesson. Please try again.");
      }
    } catch (err) {
      console.error("Error removing lesson:", err);
      setError("Failed to remove lesson. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="course-builder-loading">Loading course content...</div>
    );
  }

  if (error) {
    return <div className="course-builder-error">{error}</div>;
  }

  return (
    <div className="course-builder">
      <h2 className="mb-4 text-2xl font-bold">Course Builder</h2>
      <p className="course-builder-description mb-6 text-muted-foreground">
        Drag and drop to reorder lessons, topics, and quizzes. Click on items to
        expand and manage content.
      </p>

      <div className="course-builder-content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lessons.map((lesson) => `lesson-${lesson.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="lessons-container space-y-4">
              {lessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  isExpanded={expandedItems[`lesson-${lesson.id}`] || false}
                  onToggleExpand={() => handleToggleExpand("lesson", lesson.id)}
                  onAddTopic={() => handleAddTopic(lesson.id)}
                  onTitleChange={(newTitle) =>
                    handleTitleChange("lesson", lesson.id, newTitle)
                  }
                  onAddQuiz={(topicId) => handleAddQuiz(topicId)}
                  onTopicTitleChange={(topicId, newTitle) =>
                    handleTitleChange("topic", topicId, newTitle)
                  }
                  onQuizTitleChange={(quizId, newTitle) =>
                    handleTitleChange("quiz", quizId, newTitle)
                  }
                  expandedTopics={expandedItems}
                  onToggleTopicExpand={(topicId) =>
                    handleToggleExpand("topic", topicId)
                  }
                />
              ))}

              {lessons.length === 0 && (
                <DropZone message="No lessons yet. Add your first lesson to get started!" />
              )}
            </div>
          </SortableContext>

          <div className="mt-4">
            <AddLessonButton onClick={handleAddLesson} />
          </div>

          {activeId && activeItem && activeType && (
            <DragOverlay>
              {activeType === "lesson" && (
                <LessonItem
                  title={activeItem.title}
                  status={activeItem.status}
                  isDragging={true}
                  topicCount={(activeItem.topics || []).length}
                />
              )}
              {activeType === "topic" && (
                <TopicItem
                  title={activeItem.title}
                  status={activeItem.status}
                  isDragging={true}
                  quizCount={(activeItem.quizzes || []).length}
                />
              )}
              {activeType === "quiz" && (
                <QuizItem
                  title={activeItem.title}
                  status={activeItem.status}
                  isDragging={true}
                  parentType="topic"
                />
              )}
            </DragOverlay>
          )}
        </DndContext>
      </div>
    </div>
  );
};

export default CourseBuilder;
