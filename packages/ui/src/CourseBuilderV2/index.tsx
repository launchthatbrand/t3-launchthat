import type {} from // DragEndEvent, // Remove unused
// DragOverEvent, // Remove unused
// DragStartEvent, // Remove unused
// Unused Event types removed
// PointerSensor,
// KeyboardSensor,
"@dnd-kit/core";
// Import CSS files - moved back to root
import "./index.css";
import "./styles.css";

import React, { useCallback } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Toaster } from "@acme/ui/sonner";

// Remove unused Doc import
import type { Id } from "../../../../apps/wsa/convex/_generated/dataModel";
import type { CourseBuilderV2Props } from "./types";
// import { LessonItem as OldLessonItem } from "./components/Item/LessonItem"; // Removed unused
// import { QuizItem } from "./components/Item/QuizItem"; // Removed unused
// import { QuizList } from "./components/Item/QuizList"; // Removed unused
// import { TopicItem as OldTopicItem } from "./components/Item/TopicItem"; // Removed unused
// import { TopicList } from "./components/Item/TopicList"; // Removed unused
// import { AddLessonButton } from "./components/Sidebar/AddLessonButton"; // Removed unused
import { SidebarLessonItem } from "./components/Sidebar/SidebarLessonItem";
import { SidebarQuizItem } from "./components/Sidebar/SidebarQuizItem";
import { SidebarTopicItem } from "./components/Sidebar/SidebarTopicItem";
import { DropZone } from "./components/Sortable/DropZone";
import { SortableLesson } from "./components/Sortable/SortableLesson";
import { SortableQuiz } from "./components/Sortable/SortableQuiz";
import { useCourseBuilderDnd } from "./hooks/useCourseBuilderDnd";
import { useCourseData } from "./hooks/useCourseData";

export const CourseBuilderV2: React.FC<CourseBuilderV2Props> = (props) => {
  const {
    courseId,
    initialLessons,
    finalQuizzes: initialFinalQuizzes,
    availableLessons,
    availableTopics,
    availableQuizzes,
    // Raw callbacks passed to hooks
    onAddLesson,
    onAddTopic,
    onAddQuiz,
    onTitleChangeLesson,
    onTitleChangeTopic,
    onTitleChangeQuiz,
    onRemoveLesson,
    onRemoveTopic,
    onRemoveQuiz,
    onReorderItems,
    onAttachLesson,
    onAttachTopic,
    onAttachQuizToTopic,
    onAttachQuizToFinal,
  } = props;

  // Hooks manage state and provide wrapped functions/handlers
  const {
    lessons,
    finalQuizzes,
    isMutating,
    addTopic,
    addQuiz,
    removeLesson,
    removeTopic,
    removeQuiz,
    changeLessonTitle,
    changeTopicTitle,
    changeQuizTitle,
  } = useCourseData({
    initialLessons,
    initialFinalQuizzes,
    onAddLesson,
    onAddTopic,
    onAddQuiz,
    onRemoveLesson,
    onRemoveTopic,
    onRemoveQuiz,
    onTitleChangeLesson,
    onTitleChangeTopic,
    onTitleChangeQuiz,
  });

  // Define sensors locally
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(MouseSensor),
    useSensor(TouchSensor),
  );

  // Define handleDragCancel locally (can be refined later)
  const handleDragCancel = useCallback(() => {
    // Logic to reset state if drag is cancelled (e.g., clear activeDragData)
    console.log("Drag cancelled");
    // You might need to update state here depending on hook implementation
  }, []);

  const { activeDragData, handleDragStart, handleDragOver, handleDragEnd } =
    useCourseBuilderDnd({
      courseId,
      lessons,
      finalQuizzes,
      // Pass dummy functions for now as the hook expects them
      // TODO: Verify if setLessons/setFinalQuizzes are still needed by the hook
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setLessons: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setFinalQuizzes: () => {},
      onReorderItems,
      onAttachLesson,
      onAttachTopic,
      onAttachQuizToTopic,
      onAttachQuizToFinal,
    });

  // Placeholder useMemo/useCallback implementations
  // const sortedLessonIds = useMemo( // Removed unused
  //   () => lessons.map((l) => `lesson-${l._id}`),
  //   [lessons],
  // );
  // const sortedFinalQuizIds = useMemo( // Removed unused
  //   () => finalQuizzes.map((q) => `quiz-${q._id}`),
  //   [finalQuizzes],
  // );
  const getSortedTopicIds = useCallback(
    (lessonId: Id<"lessons">) => {
      const lesson = lessons.find((l) => l._id === lessonId);
      // Ensure topics exist before mapping
      return lesson?.topics?.map((t) => `topic-${t._id}`) ?? [];
    },
    [lessons],
  );
  const getSortedQuizIds = useCallback(
    (topicId: Id<"topics">) => {
      const topic = lessons
        .flatMap((l) => l.topics ?? []) // Handle potentially undefined topics
        .find((t) => t._id === topicId); // Removed unnecessary optional chain
      // Ensure quizzes exist before mapping
      return topic?.quizzes?.map((q) => `quiz-${q._id}`) ?? [];
    },
    [lessons],
  );

  // TODO: Refine this - might not be needed depending on DropZone implementation
  // const isSortingContainer = true; // Removed unused

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxis]}
    >
      <div className="flex h-full w-full flex-row">
        <div className="flex-grow space-y-4">
          {lessons.length === 0 && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 p-8 text-center text-muted-foreground">
              <h3 className="mb-2 text-lg font-semibold">
                Course has no content yet.
              </h3>
              <p>Add a new Lesson or add an existing one from the sidebar.</p>
            </div>
          )}
          {lessons.length > 0 && (
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <SortableLesson
                  key={lesson._id}
                  lesson={lesson}
                  isMutating={isMutating}
                  activeDragData={activeDragData}
                  addTopic={addTopic}
                  removeLesson={removeLesson}
                  changeLessonTitle={changeLessonTitle}
                  removeTopic={removeTopic}
                  changeTopicTitle={changeTopicTitle}
                  addQuiz={addQuiz}
                  removeQuiz={removeQuiz}
                  changeQuizTitle={changeQuizTitle}
                  getSortedTopicIds={getSortedTopicIds}
                  getSortedQuizIds={getSortedQuizIds}
                />
              ))}
            </div>
          )}

          <DropZone
            id="course-drop-zone"
            className="flex min-h-[80px] items-center justify-center rounded border-2 border-dashed border-muted-foreground/50 text-muted-foreground"
            acceptedTypes={["sidebarLesson"]}
            activeDragData={activeDragData}
            data={{ type: "courseDropZone" }}
          >
            Drop available lesson here to add to course
          </DropZone>

          <div className="mt-8 border-t pt-4">
            <h2 className="mb-2 text-lg font-semibold uppercase text-muted-foreground">
              Final Quizzes
            </h2>
            <div className="mb-4 space-y-2">
              {finalQuizzes.length > 0 ? (
                finalQuizzes.map((quiz) => (
                  <SortableQuiz
                    key={quiz._id}
                    quiz={quiz}
                    parentId="final-quizzes-zone"
                    isMutating={isMutating}
                    changeQuizTitle={changeQuizTitle}
                    removeQuiz={removeQuiz}
                  />
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No final quizzes assigned yet.
                </p>
              )}
            </div>

            <DropZone
              id="final-quizzes-zone"
              className="flex min-h-[100px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted/30 p-4 text-muted-foreground"
              acceptedTypes={["sidebarQuiz", "quiz"]}
              activeDragData={activeDragData}
              data={{ type: "finalQuizzesDropZone" }}
            >
              <p className="text-center text-sm">
                Drop Quizzes here to make them Final Quizzes
              </p>
            </DropZone>
          </div>
        </div>

        <aside className="w-64 flex-shrink-0 space-y-2 border-l p-4">
          <h3 className="mb-2 text-lg font-semibold">Available Items</h3>

          <Accordion type="multiple" className="w-full">
            <AccordionItem value="available-lessons">
              <AccordionTrigger className="text-sm font-medium">
                Available Lessons
              </AccordionTrigger>
              <AccordionContent>
                {availableLessons && availableLessons.length > 0 ? (
                  availableLessons.map((lesson) => (
                    <SidebarLessonItem key={lesson._id} lesson={lesson} />
                  ))
                ) : (
                  <p className="px-1 py-2 text-xs text-muted-foreground">
                    {availableLessons === undefined
                      ? "Loading..."
                      : "No available lessons."}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="available-topics">
              <AccordionTrigger className="text-sm font-medium">
                Available Topics
              </AccordionTrigger>
              <AccordionContent>
                {availableTopics && availableTopics.length > 0 ? (
                  availableTopics.map((topic) => (
                    <SidebarTopicItem key={topic._id} topic={topic} />
                  ))
                ) : (
                  <p className="px-1 py-2 text-xs text-muted-foreground">
                    {availableTopics === undefined
                      ? "Loading..."
                      : "No available topics."}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="available-quizzes">
              <AccordionTrigger className="text-sm font-medium">
                Available Quizzes
              </AccordionTrigger>
              <AccordionContent>
                {availableQuizzes && availableQuizzes.length > 0 ? (
                  availableQuizzes.map((quiz) => (
                    <SidebarQuizItem key={quiz._id} quiz={quiz} />
                  ))
                ) : (
                  <p className="px-1 py-2 text-xs text-muted-foreground">
                    {availableQuizzes === undefined
                      ? "Loading..."
                      : "No available quizzes."}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>
      </div>

      <Toaster />
    </DndContext>
  );
};
