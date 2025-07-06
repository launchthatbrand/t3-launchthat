"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { Active, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { EditItemDialog } from "@/components/EditItemDialog";
import { NestedSortableList } from "@/components/NestedSortableList";
import { NewItemDialog } from "@/components/NewItemDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@convex-config/_generated/api";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, GripVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import {
  LessonForm,
  LessonFormValues,
} from "../../../../lessons/_components/LessonForm";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  data: { type: string; item: Doc<"lessons"> | Doc<"topics"> | Doc<"quizzes"> };
  isOverlayDragging?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  children,
  data,
  isOverlayDragging,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id,
    data,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isOverlayDragging ? 0.5 : 1,
    zIndex: isSortableDragging || isOverlayDragging ? 100 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="my-2 rounded-md border p-4 shadow-sm"
    >
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab"
        {...listeners}
        data-dnd-handle="true"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="ml-8">{children}</div>
    </div>
  );
};

interface DropzoneProps {
  id: string;
  children: React.ReactNode;
  lessonId: Id<"lessons">;
}

const TopicDropzone: React.FC<DropzoneProps> = ({ id, children, lessonId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { lessonId, type: "topicDropzone" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mt-2 rounded-md border p-2 text-center text-muted-foreground ${
        isOver ? "border-primary bg-primary/10" : "border-dashed"
      }`}
    >
      {children}
    </div>
  );
};

const QuizDropzone: React.FC<DropzoneProps> = ({ id, children, lessonId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { lessonId, type: "quizDropzone" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mt-2 rounded-md border p-2 text-center text-muted-foreground ${
        isOver ? "border-primary bg-primary/10" : "border-dashed"
      }`}
    >
      {children}
    </div>
  );
};

interface LessonDropzoneData {
  type: "course-structure-droppable";
}

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

type ActiveCurrentData =
  | DraggedItemData
  | LessonDropzoneData
  | TopicDropzoneData
  | QuizDropzoneData;

// Edit Lesson Dialog Component using shared LessonForm
const EditLessonDialog: React.FC<{
  lesson: Doc<"lessons">;
  onSave: (values: LessonFormValues) => Promise<void>;
}> = ({ lesson, onSave }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder categories until taxonomy implemented
  const categories = [
    { value: "general", label: "General" },
    { value: "advanced", label: "Advanced" },
  ];

  const handleSubmit = async (values: LessonFormValues) => {
    setIsSubmitting(true);
    await onSave(values);
    setIsSubmitting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
        </DialogHeader>
        <LessonForm
          initialData={{
            title: lesson.title,
            content: lesson.content ?? "",
            excerpt: lesson.excerpt ?? "",
            categories: lesson.categories?.join(", ") ?? "",
            featuredImageUrl: lesson.featuredImage ?? "",
            status: lesson.isPublished ? "published" : "draft",
            featured: false,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          categories={categories}
          submitButtonText="Save Lesson"
        />
      </DialogContent>
    </Dialog>
  );
};

// Create Lesson Dialog Component using shared LessonForm
const CreateLessonDialog: React.FC<{
  courseId: Id<"courses">;
  onCreate: (lessonId: Id<"lessons">) => Promise<void>;
}> = ({ courseId, onCreate }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLesson = useMutation(api.lms.lessons.index.create);
  const addLessonToCourse = useMutation(
    api.lms.courses.index.addLessonToCourse,
  );

  // Placeholder categories until taxonomy implemented
  const categories = [
    { value: "general", label: "General" },
    { value: "advanced", label: "Advanced" },
  ];

  const handleSubmit = async (values: LessonFormValues) => {
    setIsSubmitting(true);
    try {
      const newLessonId = await createLesson({
        title: values.title,
        content: values.content,
        excerpt: values.excerpt,
        categories: values.categories
          ? values.categories
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
          : undefined,
        featuredImage: values.featuredImageUrl,
      });
      await addLessonToCourse({ courseId, lessonId: newLessonId });
      await onCreate(newLessonId);
      toast.success("Lesson created and added to course!");
      setOpen(false);
    } catch (error) {
      console.error("Failed to create lesson:", error);
      toast.error("Failed to create lesson.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="m-2 h-auto px-2 py-1">
          Create Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create New Lesson</DialogTitle>
        </DialogHeader>
        <LessonForm
          initialData={null}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          categories={categories}
          submitButtonText="Create Lesson"
        />
      </DialogContent>
    </Dialog>
  );
};

// Topic and Quiz creation schemas (used in sidebar dialogs)
const newTopicSchema = z.object({
  title: z.string().min(1, { message: "Topic title is required" }),
  contentType: z.union(
    [z.literal("text"), z.literal("video"), z.literal("quiz")],
    { message: "Content type is required" },
  ),
  content: z.string().optional(),
});

const newQuizSchema = z.object({
  title: z.string().min(1, { message: "Quiz title is required" }),
});

// Forms for topic and quiz creation
const useNewTopicForm = () =>
  useForm<z.infer<typeof newTopicSchema>>({
    resolver: zodResolver(newTopicSchema),
    defaultValues: { title: "", contentType: "text", content: "" },
  });

const useNewQuizForm = () =>
  useForm<z.infer<typeof newQuizSchema>>({
    resolver: zodResolver(newQuizSchema),
    defaultValues: { title: "" },
  });

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
    api.lms.courses.index.addLessonToCourse,
  );
  const removeLessonFromCourseStructure = useMutation(
    api.lms.courses.index.removeLessonFromCourseStructure,
  );
  const reorderLessonsInCourse = useMutation(
    api.lms.courses.index.reorderLessonsInCourse,
  );
  const createTopic = useMutation(api.lms.topics.index.create);
  const attachTopicToLesson = useMutation(api.lms.topics.index.attachToLesson);
  const removeTopicFromLesson = useMutation(
    api.lms.topics.index.removeTopicFromLesson,
  );
  const createQuiz = useMutation(api.lms.quizzes.index.create);
  const attachQuizToLesson = useMutation(api.lms.quizzes.index.attach);
  const removeQuizFromLesson = useMutation(
    api.lms.quizzes.index.removeQuizFromLesson,
  );
  const updateLesson = useMutation(api.lms.lessons.index.update);
  const updateTopicTitle = useMutation(api.lms.topics.index.updateTitle);
  const updateQuizTitle = useMutation(api.lms.quizzes.index.updateTitle);

  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const [isNewQuizModalOpen, setIsNewQuizModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Id<"lessons"> | null>(
    null,
  );

  // Track expanded/collapsed lessons
  const [expandedLessons, setExpandedLessons] = useState<Id<"lessons">[]>([]);

  const toggleLessonExpand = (lessonId: Id<"lessons">) => {
    setExpandedLessons((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId],
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

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

  // Initialize forms for topic and quiz creation
  const newTopicForm = useNewTopicForm();
  const newQuizForm = useNewQuizForm();

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

  interface CourseStructureItem {
    lessonId: Id<"lessons">;
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
        } catch (error) {
          console.error("Failed to reorder lessons:", error);
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
      } catch (error) {
        console.error("Failed to add lesson to course:", error);
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
      } catch (error) {
        console.error("Failed to attach topic to lesson:", error);
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
      } catch (error) {
        console.error("Failed to attach quiz to lesson:", error);
        toast.error("Failed to attach quiz to lesson.");
      }
    }

    setActiveItem(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };

  const handleNewTopicSubmit = async (
    values: z.infer<typeof newTopicSchema>,
  ) => {
    try {
      await createTopic(values);
      toast.success("Topic created!");
      setIsNewTopicModalOpen(false);
      newTopicForm.reset();
    } catch (error) {
      console.error("Failed to create topic:", error);
      toast.error("Failed to create topic.");
    }
  };

  const handleNewQuizSubmit = async (values: z.infer<typeof newQuizSchema>) => {
    try {
      await createQuiz({ title: values.title, questions: [] }); // Pass empty array for questions
      toast.success("Quiz created!");
      setIsNewQuizModalOpen(false);
      newQuizForm.reset();
    } catch (error) {
      console.error("Failed to create quiz:", error);
      toast.error("Failed to create quiz.");
    }
  };

  const handleAddLessonToCourse = async (lessonId: Id<"lessons">) => {
    if (!courseId) return;
    try {
      await addLessonToCourse({ courseId, lessonId });
      toast.success("Lesson added to course structure!");
    } catch (error) {
      console.error("Failed to add lesson to course:", error);
      toast.error("Failed to add lesson to course.");
    }
  };

  const handleRemoveLessonFromCourse = async (lessonId: Id<"lessons">) => {
    if (!courseId) return;
    try {
      await removeLessonFromCourseStructure({ courseId, lessonId });
      toast.success("Lesson removed from course structure!");
    } catch (error) {
      console.error("Failed to remove lesson from course:", error);
      toast.error("Failed to remove lesson from course.");
    }
  };

  const handleRemoveTopicFromLesson = async (topicId: Id<"topics">) => {
    try {
      await removeTopicFromLesson({ topicId });
      toast.success("Topic removed from lesson!");
    } catch (error) {
      console.error("Failed to remove topic from lesson:", error);
      toast.error("Failed to remove topic from lesson.");
    }
  };

  const handleRemoveQuizFromLesson = async (quizId: Id<"quizzes">) => {
    try {
      await removeQuizFromLesson({ quizId });
      toast.success("Quiz removed from lesson!");
    } catch (error) {
      console.error("Failed to remove quiz from lesson:", error);
      toast.error("Failed to remove quiz from lesson.");
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Course Builder</h1>

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <SortableContext
                  items={lessonsInCourseStructure.map((l) => l._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {lessonsInCourseStructure.length === 0 ? (
                    <div
                      id="course-structure-droppable"
                      className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground"
                    >
                      Drag available lessons here to add them to the course
                      structure.
                    </div>
                  ) : (
                    lessonsInCourseStructure.map((lesson) => {
                      const topicsForLesson = courseData.attachedTopics.filter(
                        (t) => t.lessonId === lesson._id,
                      );
                      const quizzesForLesson =
                        courseData.attachedQuizzes.filter(
                          (q) => q.lessonId === lesson._id,
                        );

                      return (
                        <SortableItem
                          key={lesson._id}
                          id={lesson._id}
                          data={{ type: "lesson", item: lesson }}
                        >
                          <Card
                            className={`relative mb-4 shadow-sm ${
                              selectedLesson === lesson._id
                                ? "ring-2 ring-primary"
                                : ""
                            }`}
                          >
                            <CardHeader
                              className="flex cursor-pointer flex-row items-center justify-between space-y-0 p-2"
                              onClick={() => {
                                setSelectedLesson(lesson._id);
                                toggleLessonExpand(lesson._id);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    expandedLessons.includes(lesson._id)
                                      ? "rotate-180"
                                      : "rotate-0"
                                  }`}
                                />
                                <CardTitle className="text-lg font-medium">
                                  {lesson.title}
                                </CardTitle>
                              </div>
                              <div
                                className="flex gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EditLessonDialog
                                  lesson={lesson}
                                  onSave={async (values) => {
                                    await updateLesson({
                                      lessonId: lesson._id,
                                      title: values.title,
                                      content: values.content,
                                      excerpt: values.excerpt,
                                      categories: values.categories
                                        ? values.categories
                                            .split(",")
                                            .map((c: string) => c.trim())
                                            .filter(Boolean)
                                        : undefined,
                                      featuredImage: values.featuredImageUrl,
                                    });
                                    toast.success("Lesson updated!");
                                  }}
                                />
                                <ConfirmationDialog
                                  triggerButtonText="Remove"
                                  title="Are you sure you want to remove this lesson?"
                                  description="This action will remove the lesson from the course structure."
                                  onConfirm={() =>
                                    handleRemoveLessonFromCourse(lesson._id)
                                  }
                                />
                              </div>
                            </CardHeader>
                            {expandedLessons.includes(lesson._id) && (
                              <CardContent>
                                <p className="text-sm text-muted-foreground">
                                  {lesson.description}
                                </p>
                                <div className="mt-4">
                                  <NestedSortableList
                                    title="Topics"
                                    items={topicsForLesson}
                                    emptyMessage="Drag available topics here"
                                    renderItem={(topic) => (
                                      <div
                                        key={topic._id}
                                        className="mb-2 flex items-center justify-between gap-2 rounded-md border p-2"
                                      >
                                        <span>
                                          {topic.title} ({topic.contentType})
                                        </span>
                                        <div className="flex gap-2">
                                          <EditItemDialog
                                            dialogTitle="Edit Topic"
                                            initialTitle={topic.title}
                                            onSubmit={async ({ title }) => {
                                              await updateTopicTitle({
                                                topicId: topic._id,
                                                title,
                                              });
                                              toast.success("Topic updated!");
                                            }}
                                          />
                                          <ConfirmationDialog
                                            triggerButtonText="Remove"
                                            title="Are you sure you want to remove this topic?"
                                            description="This action will detach the topic from the lesson."
                                            onConfirm={() =>
                                              handleRemoveTopicFromLesson(
                                                topic._id,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    )}
                                    DropzoneComponent={TopicDropzone}
                                    lessonId={lesson._id}
                                    dropzoneType="topicDropzone"
                                  />

                                  <NestedSortableList
                                    title="Quizzes"
                                    items={quizzesForLesson}
                                    emptyMessage="Drag available quizzes here"
                                    renderItem={(quiz) => (
                                      <div
                                        key={quiz._id}
                                        className="mb-2 flex items-center justify-between gap-2 rounded-md border p-2"
                                      >
                                        <span>{quiz.title}</span>
                                        <div className="flex gap-2">
                                          <EditItemDialog
                                            dialogTitle="Edit Quiz"
                                            initialTitle={quiz.title}
                                            onSubmit={async ({ title }) => {
                                              await updateQuizTitle({
                                                quizId: quiz._id,
                                                title,
                                              });
                                              toast.success("Quiz updated!");
                                            }}
                                          />
                                          <ConfirmationDialog
                                            triggerButtonText="Remove"
                                            title="Are you sure you want to remove this quiz?"
                                            description="This action will detach the quiz from the lesson."
                                            onConfirm={() =>
                                              handleRemoveQuizFromLesson(
                                                quiz._id,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    )}
                                    DropzoneComponent={QuizDropzone}
                                    lessonId={lesson._id}
                                    dropzoneType="quizDropzone"
                                  />
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        </SortableItem>
                      );
                    })
                  )}
                </SortableContext>
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
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Available Items and Creation Forms */}
          <div>
            {/* Lesson Selector */}
            <Command className="h-44 rounded-lg border shadow-md">
              <div className="flex items-center border-b">
                <CommandInput
                  placeholder="Search lesson..."
                  className="flex-1 border-none"
                />
                <CreateLessonDialog
                  courseId={courseId}
                  onCreate={(id) => {
                    setSelectedLesson(id);
                    return Promise.resolve();
                  }}
                />
              </div>
              <CommandList>
                <CommandEmpty>No lesson found.</CommandEmpty>
                <CommandGroup>
                  {availableLessons.map((lesson) => (
                    <CommandItem
                      key={lesson._id}
                      value={lesson.title}
                      onSelect={async () => {
                        await handleAddLessonToCourse(lesson._id);
                        setSelectedLesson(lesson._id);
                      }}
                    >
                      {lesson.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>

            <Separator className="my-6" />

            {/* Topic Selector */}
            <Command className="h-44 rounded-lg border shadow-md">
              <div className="flex items-center border-b">
                <CommandInput
                  placeholder="Search topic..."
                  className="flex-1! border-none"
                />
                <NewItemDialog
                  title="Create New Topic"
                  description="Enter the title and content type for your new topic."
                  form={newTopicForm}
                  onSubmit={handleNewTopicSubmit}
                  open={isNewTopicModalOpen}
                  onOpenChange={setIsNewTopicModalOpen}
                  triggerButtonText="Create Topic"
                  triggerButtonClassName="m-2 text-s p-1 h-auto w-auto"
                  triggerButtonVariant="outline"
                >
                  <FormField
                    control={newTopicForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newTopicForm.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="text">Text</option>
                            <option value="video">Video</option>
                            <option value="quiz">Quiz</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {newTopicForm.watch("contentType") === "text" && (
                    <FormField
                      control={newTopicForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </NewItemDialog>
              </div>
              <CommandList>
                <CommandEmpty>No topic found.</CommandEmpty>
                <CommandGroup>
                  {availableTopics.map((topic) => (
                    <CommandItem
                      key={topic._id}
                      value={topic.title}
                      onSelect={async () => {
                        if (!selectedLesson) {
                          toast.error("Select a lesson first");
                          return;
                        }
                        await attachTopicToLesson({
                          lessonId: selectedLesson,
                          topicId: topic._id,
                          order: 0,
                        });
                        toast.success("Topic attached to lesson!");
                      }}
                    >
                      {topic.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>

            <Separator className="my-6" />

            {/* Quiz Selector */}
            <Command className="h-44 rounded-lg border shadow-md">
              <div className="flex items-center border-b">
                <CommandInput
                  placeholder="Search quiz..."
                  className="flex-1! border-none"
                />
                <NewItemDialog
                  title="Create New Quiz"
                  description="Enter the title for your new quiz."
                  form={newQuizForm}
                  onSubmit={handleNewQuizSubmit}
                  open={isNewQuizModalOpen}
                  onOpenChange={setIsNewQuizModalOpen}
                  triggerButtonText="Create Quiz"
                  triggerButtonClassName="m-2 text-s p-1 h-auto w-auto"
                  triggerButtonVariant="outline"
                >
                  <FormField
                    control={newQuizForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </NewItemDialog>
              </div>
              <CommandList>
                <CommandEmpty>No quiz found.</CommandEmpty>
                <CommandGroup>
                  {availableQuizzes.map((quiz) => (
                    <CommandItem
                      key={quiz._id}
                      value={quiz.title}
                      onSelect={async () => {
                        if (!selectedLesson) {
                          toast.error("Select a lesson first");
                          return;
                        }
                        await attachQuizToLesson({
                          lessonId: selectedLesson,
                          quizId: quiz._id,
                          order: 0,
                          isFinal: false,
                        });
                        toast.success("Quiz attached to lesson!");
                      }}
                    >
                      {quiz.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
