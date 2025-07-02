"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Doc, Id } from "@convex-config/_generated/dataModel";
import {
  Active,
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
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
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  data: { type: string; item: Doc<"lessons"> | Doc<"topics"> | Doc<"quizzes"> };
  isDragging?: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children, data }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="my-2 cursor-grab rounded-md border p-4 shadow-sm active:cursor-grabbing"
    >
      {children}
    </div>
  );
};

const newLessonSchema = z.object({
  title: z.string().min(1, { message: "Lesson title is required" }),
});

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

type DraggedItemData = {
  type: string;
  item: Doc<"lessons"> | Doc<"topics"> | Doc<"quizzes">;
};

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
  const createLesson = useMutation(api.lms.lessons.index.create);
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

  const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState(false);
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const [isNewQuizModalOpen, setIsNewQuizModalOpen] = useState(false);

  // Forms
  const newLessonForm = useForm<z.infer<typeof newLessonSchema>>({
    resolver: zodResolver(newLessonSchema),
    defaultValues: { title: "" },
  });

  const newTopicForm = useForm<z.infer<typeof newTopicSchema>>({
    resolver: zodResolver(newTopicSchema),
    defaultValues: { title: "", contentType: "text", content: "" },
  });

  const newQuizForm = useForm<z.infer<typeof newQuizSchema>>({
    resolver: zodResolver(newQuizSchema),
    defaultValues: { title: "" },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const [activeItem, setActiveItem] = useState<Active<DraggedItemData> | null>(
    null,
  );

  const activeDragItem = useMemo(() => {
    if (!activeItem) return null;
    const data = activeItem.data.current;
    if (!data) return null;

    switch (data.type) {
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

  const activeDragItemType = activeItem?.data.current?.type;

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

  type CourseStructureItem = { lessonId: Id<"lessons"> };
  const lessonsInCourseStructure: (Doc<"lessons"> & { type: "lesson" })[] = (
    (courseData.course.courseStructure as CourseStructureItem[]) ?? []
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
    setActiveItem(event.active as Active<DraggedItemData>);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveItem(null);
      return;
    }

    const activeType = active.data.current?.type;
    const activeId = active.id as Id<"lessons" | "topics" | "quizzes">;
    const overType = over.data.current?.type;
    const overId = over.id as Id<"lessons" | "topics" | "quizzes">;

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

    // Handle adding available topic to a lesson
    if (activeType === "availableTopic" && overType === "lesson") {
      try {
        await attachTopicToLesson({
          lessonId: overId as Id<"lessons">,
          topicId: activeId as Id<"topics">,
          order: 0, // Placeholder, can be refined later
        });
        toast.success("Topic attached to lesson!");
      } catch (error) {
        console.error("Failed to attach topic to lesson:", error);
        toast.error("Failed to attach topic to lesson.");
      }
    }

    // Handle adding available quiz to a lesson
    if (activeType === "availableQuiz" && overType === "lesson") {
      try {
        await attachQuizToLesson({
          lessonId: overId as Id<"lessons">,
          quizId: activeId as Id<"quizzes">,
          order: 0, // Placeholder, can be refined later
          isFinal: false, // Assuming not a final quiz when attaching to lesson
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

  const handleNewLessonSubmit = async (
    values: z.infer<typeof newLessonSchema>,
  ) => {
    if (!courseId) {
      toast.error("Course ID is missing.");
      return;
    }
    try {
      const newLessonId = await createLesson({ title: values.title });
      await addLessonToCourse({ courseId, lessonId: newLessonId });
      toast.success("Lesson created and added to course!");
      setIsNewLessonModalOpen(false);
      newLessonForm.reset();
    } catch (error) {
      console.error("Failed to create lesson:", error);
      toast.error("Failed to create lesson.");
    }
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
    <div className="container mx-auto py-8">
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
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Course Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
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
                          <Card className="relative mb-4 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-lg font-medium">
                                {lesson.title}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveLessonFromCourse(lesson._id)
                                }
                              >
                                Remove
                              </Button>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {lesson.description}
                              </p>
                              <div className="mt-4">
                                <h4 className="text-md mb-2 font-semibold">
                                  Topics:
                                </h4>
                                {topicsForLesson.length > 0 ? (
                                  topicsForLesson.map((topic) => (
                                    <div
                                      key={topic._id}
                                      className="mb-2 flex items-center justify-between rounded-md border p-2"
                                    >
                                      <span>
                                        {topic.title} ({topic.contentType})
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveTopicFromLesson(topic._id)
                                        }
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No topics attached to this lesson.
                                  </p>
                                )}
                                <h4 className="text-md mb-2 mt-4 font-semibold">
                                  Quizzes:
                                </h4>
                                {quizzesForLesson.length > 0 ? (
                                  quizzesForLesson.map((quiz) => (
                                    <div
                                      key={quiz._id}
                                      className="mb-2 flex items-center justify-between rounded-md border p-2"
                                    >
                                      <span>{quiz.title}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveQuizFromLesson(quiz._id)
                                        }
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No quizzes attached to this lesson.
                                  </p>
                                )}
                              </div>
                            </CardContent>
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
                      data={activeItem.data.current}
                      isDragging={true}
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
              </DndContext>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Available Items and Creation Forms */}
        <div>
          {/* Create New Lesson */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Create New Lesson</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isNewLessonModalOpen}
                onOpenChange={setIsNewLessonModalOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full">Create Lesson</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Lesson</DialogTitle>
                    <DialogDescription>
                      Enter the title for your new lesson.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...newLessonForm}>
                    <form
                      onSubmit={newLessonForm.handleSubmit(
                        handleNewLessonSubmit,
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={newLessonForm.control}
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
                      <Button type="submit" className="w-full">
                        Submit
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Available Lessons */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Available Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              {availableLessons.length === 0 ? (
                <p className="text-muted-foreground">No lessons available.</p>
              ) : (
                availableLessons.map((lesson) => (
                  <div
                    key={lesson._id}
                    className="flex items-center justify-between border-b py-2 last:border-b-0"
                  >
                    <span>{lesson.title}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddLessonToCourse(lesson._id)}
                    >
                      Add
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {/* Create New Topic */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Create New Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isNewTopicModalOpen}
                onOpenChange={setIsNewTopicModalOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full">Create Topic</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                    <DialogDescription>
                      Enter the title and content type for your new topic.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...newTopicForm}>
                    <form
                      onSubmit={newTopicForm.handleSubmit(handleNewTopicSubmit)}
                      className="space-y-4"
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
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                  placeholder="Topic content..."
                                  {...field}
                                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <Button type="submit" className="w-full">
                        Submit
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Available Topics */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Available Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <SortableContext
                items={availableTopics.map((t) => t._id)}
                strategy={verticalListSortingStrategy}
              >
                {availableTopics.length === 0 ? (
                  <p className="text-muted-foreground">No topics available.</p>
                ) : (
                  availableTopics.map((topic) => (
                    <SortableItem
                      key={topic._id}
                      id={topic._id}
                      data={{ type: "availableTopic", item: topic }}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {topic.title} ({topic.contentType})
                        </span>
                      </div>
                    </SortableItem>
                  ))
                )}
              </SortableContext>
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {/* Create New Quiz */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Create New Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isNewQuizModalOpen}
                onOpenChange={setIsNewQuizModalOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full">Create Quiz</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Quiz</DialogTitle>
                    <DialogDescription>
                      Enter the title for your new quiz.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...newQuizForm}>
                    <form
                      onSubmit={newQuizForm.handleSubmit(handleNewQuizSubmit)}
                      className="space-y-4"
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
                      <Button type="submit" className="w-full">
                        Submit
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Available Quizzes */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Available Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <SortableContext
                items={availableQuizzes.map((q) => q._id)}
                strategy={verticalListSortingStrategy}
              >
                {availableQuizzes.length === 0 ? (
                  <p className="text-muted-foreground">No quizzes available.</p>
                ) : (
                  availableQuizzes.map((quiz) => (
                    <SortableItem
                      key={quiz._id}
                      id={quiz._id}
                      data={{ type: "availableQuiz", item: quiz }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{quiz.title}</span>
                      </div>
                    </SortableItem>
                  ))
                )}
              </SortableContext>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
