import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type {
  DraggableItemData,
  Id,
  LessonWithTopics,
  Quiz,
} from "../../types";
import { LessonItem } from "../Item/LessonItem";
import { DropZone } from "../Sortable/DropZone"; // Added DropZone import

import { SortableTopic } from "./SortableTopic"; // Assuming location

// Add Quiz type import

// import { AddTopicButton } from "../Sidebar/AddTopicButton"; // Corrected location - Placeholder file, commented out for now

interface SortableLessonProps {
  lesson: LessonWithTopics;
  // Callbacks from useCourseData
  addTopic: (lessonId: Id<"lessons">) => Promise<void>;
  removeLesson: (lessonId: Id<"lessons">) => Promise<void>;
  changeLessonTitle: (
    lessonId: Id<"lessons">,
    newTitle: string,
  ) => Promise<void>;
  removeTopic: (topicId: Id<"topics">) => Promise<void>;
  changeTopicTitle: (topicId: Id<"topics">, newTitle: string) => Promise<void>;
  addQuiz: (context: { topicId: Id<"topics">; order: number }) => Promise<void>;
  removeQuiz: (quizId: Id<"quizzes">) => Promise<void>;
  changeQuizTitle: (quizId: Id<"quizzes">, newTitle: string) => Promise<void>;
  // DnD related props from useCourseBuilderDnd
  activeDragData: DraggableItemData | null;
  getSortedTopicIds: (lessonId: Id<"lessons">) => string[];
  getSortedQuizIds: (topicId: Id<"topics">) => string[]; // Needed for SortableTopic
  // isSortingContainer, // Removed unused
  isMutating: boolean;
}

export const SortableLesson: React.FC<SortableLessonProps> = ({
  lesson,
  addTopic: _addTopic,
  removeLesson,
  changeLessonTitle,
  removeTopic,
  changeTopicTitle,
  addQuiz,
  removeQuiz: _removeQuiz,
  changeQuizTitle: _changeQuizTitle,
  activeDragData,
  getSortedTopicIds,
  getSortedQuizIds: _getSortedQuizIds,
  // isSortingContainer, // Removed unused
  isMutating,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `lesson-${lesson._id}`,
    data: { type: "lesson", item: lesson, lessonId: lesson._id },
    disabled: isMutating,
  });

  // Apply attributes to the wrapper div via spread
  const wrapperAttributes = { ...attributes };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined, // Use nullish coalescing
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggleExpand = () => {
    console.log(
      "Toggling expand for lesson:",
      lesson._id,
      "New state:",
      !isExpanded,
    );
    setIsExpanded((prev) => !prev);
  };

  const sortedTopicIds = getSortedTopicIds(lesson._id);
  const topicsMap = React.useMemo(
    () =>
      new Map(
        (lesson.topics ?? []).map((topic) => [`topic-${topic._id}`, topic]),
      ),
    [lesson.topics],
  );

  return (
    <div ref={setNodeRef} style={style} {...wrapperAttributes}>
      <LessonItem
        lesson={lesson}
        isExpanded={isExpanded}
        isOverlay={isDragging}
        dragHandleProps={{
          listeners,
          // Attributes are applied to the wrapper
        }}
        onToggleExpand={handleToggleExpand}
        onTitleChange={changeLessonTitle}
        onRemove={removeLesson}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onAddQuiz={() => {}}
      />

      {isExpanded && (
        <div className="ml-4 mt-2 space-y-2 border-l pl-4 pt-2">
          {/* <SortableContext
            items={sortedTopicIds}
            strategy={verticalListSortingStrategy}
            disabled={!isSortingContainer} // Disable nested sort if parent is not sorting
          > */}
          {sortedTopicIds.map((topicIdStr) => {
            const topic = topicsMap.get(topicIdStr);
            return topic ? (
              <SortableTopic
                key={topicIdStr}
                topic={topic}
                lessonId={lesson._id}
                isExpanded={isExpanded}
                activeDragData={activeDragData}
                onAddQuiz={addQuiz}
                onRemoveTopic={removeTopic}
                onTitleChangeTopic={changeTopicTitle}
                onToggleExpand={() => {
                  console.log("Toggle expand for topic:", topic._id);
                }}
                renderQuizItem={(quiz: Quiz) => (
                  <div key={quiz._id}>Quiz: {quiz.title}</div>
                )}
              />
            ) : null; // Handle case where topic might not be found (shouldn't happen ideally)
          })}
          {/* </SortableContext> */}
          {/* Added Topic Drop Zone */}
          <DropZone
            id={`lesson-${lesson._id}-topic-dropzone`}
            className="flex min-h-[60px] items-center justify-center rounded border-2 border-dashed border-muted-foreground/30 text-muted-foreground"
            acceptedTypes={["sidebarTopic", "topic"]}
            activeDragData={activeDragData} // Pass activeDragData
            data={{ type: "topicDropZone", lessonId: lesson._id }} // Pass data prop
          >
            Drop Topic Here
          </DropZone>
          {/* <AddTopicButton
            onClick={() => addTopic(lesson._id)}
            disabled={isMutating}
          /> */}
        </div>
      )}
    </div>
  );
};
