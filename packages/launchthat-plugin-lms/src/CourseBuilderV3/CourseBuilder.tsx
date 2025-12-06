"use client";

import type {
  AccessibilityConfig,
  I18nConfig,
  SidebarConfig,
  ThemeConfig,
} from "./types/theme";
// Restore ContentItemRenderer for props
import type {
  ContentItemRenderer,
  SidebarItemRenderer,
} from "./types/callbacks";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
// Import types needed for props and mapping
// Remove unused store types (Lesson, Quiz, Topic)
import type { LessonItem, QuizItem, TopicItem } from "./types/content";

import type { CourseBuilderState } from "./store/useCourseBuilderStore";
// Restore CourseStructure for props
import type { CourseStructure } from "./types/structure";
import DragOverlayContent from "./components/DragOverlayContent";
import MainContent from "./components/MainContent";
import React from "react";
import Sidebar from "./components/Sidebar";
import type { SidebarItem } from "./types/navigation";
// Import the new layout components
import TopBar from "./components/TopBar";
// Import the new DND hook
import { useCourseBuilderDnd } from "./hooks/useCourseBuilderDnd";
// Import the main store hook
import { useCourseBuilderStore } from "./store/useCourseBuilderStore";

// Remove unused component imports
// import DraggableItem from "./components/DraggableItem";
// import Dropzone from "./components/Dropzone";
// import SortableLessonItem from "./components/SortableLessonItem";
// import SortableQuizItem from "./components/SortableQuizItem";

// mockAvailableQuizzes, // No longer needed here
// mockAvailableTopics, // No longer needed here

/**
 * Props for the CourseBuilderV3 component.
 */
export interface VimeoVideoItem {
  videoId: string;
  title: string;
  description?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

export interface CourseBuilderProps {
  // Restore core structure and action callbacks
  courseStructure?: CourseStructure; // Might be used for initial state
  initialState?: Partial<CourseBuilderState>;
  onAddLesson?: () => Promise<void>;
  onAddTopic?: (lessonId: string, order: number) => Promise<void>;
  onAddQuiz?: (
    context:
      | { topicId: string; order: number }
      | { lessonId: string; order: number }
      | { isFinalQuiz: true; courseId: string; order: number },
  ) => Promise<void>;
  onRemoveLesson?: (lessonId: string) => Promise<void>;
  onRemoveTopic?: (topicId: string) => Promise<void>;
  onRemoveQuiz?: (quizId: string) => Promise<void>;
  onTitleChangeLesson?: (lessonId: string, newTitle: string) => Promise<void>;
  onTitleChangeTopic?: (topicId: string, newTitle: string) => Promise<void>;
  onTitleChangeQuiz?: (quizId: string, newTitle: string) => Promise<void>;
  onReorderItems?: (
    activeId: string,
    overId: string | null,
    parentId?: string,
  ) => Promise<void>;
  onAttachLesson?: (
    lessonId: string,
    courseId: string,
    order: number,
  ) => Promise<void>;
  onAttachTopic?: (
    topicId: string,
    lessonId: string,
    order: number,
  ) => Promise<void>;
  onAttachQuizToTopic?: (
    quizId: string,
    topicId: string,
    order: number,
  ) => Promise<void>;
  onAttachQuizToFinal?: (
    quizId: string,
    courseId: string,
    order: number,
  ) => Promise<void>;
  onCreateLessonFromVimeo?: (video: VimeoVideoItem) => Promise<void>;
  onCreateTopicFromVimeo?: (
    lessonId: string,
    video: VimeoVideoItem,
  ) => Promise<void>;
  onCreateQuizFromVimeo?: (
    context: { lessonId?: string; topicId?: string },
    video: VimeoVideoItem,
  ) => Promise<void>;

  // Restore optional renderer props
  renderLessonItem?: ContentItemRenderer<LessonItem>;
  renderTopicItem?: ContentItemRenderer<TopicItem>;
  renderQuizItem?: ContentItemRenderer<QuizItem>;

  // Keep other props
  renderSidebarItem?: SidebarItemRenderer<SidebarItem>;
  themeConfig?: ThemeConfig;
  sidebarConfig?: SidebarConfig;
  accessibilityConfig?: AccessibilityConfig;
  i18nConfig?: I18nConfig;
  onAttachQuizToLesson?: (
    lessonId: string,
    quizId: string,
    order: number,
  ) => Promise<void>;
  onReorderLessons?: (orderedLessonIds: string[]) => Promise<void>;
  onReorderLessonTopics?: (
    lessonId: string,
    orderedTopicIds: string[],
  ) => Promise<void>;
  onReorderLessonQuizzes?: (
    lessonId: string,
    orderedQuizIds: string[],
  ) => Promise<void>;
  onReorderTopicQuizzes?: (
    topicId: string,
    orderedQuizIds: string[],
  ) => Promise<void>;
  availableVimeoVideos?: VimeoVideoItem[];
  isLoadingVimeoVideos?: boolean;
}

// Default no-op async function for callbacks
const noopAsync = async (): Promise<void> => {
  /* do nothing */
};
const noopAsyncWithArgs = async (..._args: unknown[]): Promise<void> => {
  /* do nothing */
};

/**
 * Main CourseBuilderV3 component. Pure UI, prop-driven, data-source-agnostic.
 *
 * Note: Not all callbacks are used in the minimal layout. They will be used as the component is built out.
 */

const CourseBuilder: React.FC<CourseBuilderProps> = ({
  // Destructure the restored props (even if not used directly below)
  courseStructure: _courseStructure,
  initialState,
  onAddLesson: _onAddLesson = noopAsync,
  onAddTopic: _onAddTopic = noopAsyncWithArgs,
  onAddQuiz: _onAddQuiz = noopAsyncWithArgs,
  onRemoveLesson: _onRemoveLesson = noopAsyncWithArgs,
  onRemoveTopic: _onRemoveTopic = noopAsyncWithArgs,
  onRemoveQuiz: _onRemoveQuiz = noopAsyncWithArgs,
  onTitleChangeLesson: _onTitleChangeLesson = noopAsyncWithArgs,
  onTitleChangeTopic: _onTitleChangeTopic = noopAsyncWithArgs,
  onTitleChangeQuiz: _onTitleChangeQuiz = noopAsyncWithArgs,
  onReorderItems: _onReorderItems = noopAsyncWithArgs,
  onAttachLesson: _onAttachLesson = noopAsyncWithArgs,
  onAttachTopic: _onAttachTopic = noopAsyncWithArgs,
  onAttachQuizToTopic: _onAttachQuizToTopic = noopAsyncWithArgs,
  onAttachQuizToFinal: _onAttachQuizToFinal = noopAsyncWithArgs,
  onCreateLessonFromVimeo,
  onCreateTopicFromVimeo,
  onCreateQuizFromVimeo,
  renderLessonItem: _renderLessonItem,
  renderTopicItem: _renderTopicItem,
  renderQuizItem: _renderQuizItem,
  // Keep existing props
  renderSidebarItem,
  // themeConfig,
  // sidebarConfig,
  // accessibilityConfig,
  // i18nConfig,
  onAttachQuizToLesson = noopAsyncWithArgs,
  onReorderLessons = noopAsyncWithArgs,
  onReorderLessonTopics = noopAsyncWithArgs,
  onReorderLessonQuizzes = noopAsyncWithArgs,
  onReorderTopicQuizzes = noopAsyncWithArgs,
  availableVimeoVideos,
  isLoadingVimeoVideos,
}) => {
  // 1. Get state and actions from the store
  const {
    mainContentItems,
    availableLessons: storeAvailableLessons,
    availableTopics: storeAvailableTopics,
    availableQuizzes: storeAvailableQuizzes,
    addTopicToLesson,
    addQuizToTopic,
    addQuizToLesson,
    reorderQuizzesInTopic,
    addMainContentItem,
    reorderMainContentItems,
    reorderLessonContentItems,
    initialize,
    removeLesson,
    removeTopicFromLesson,
    removeQuizFromLesson,
    removeQuizFromTopic,
    removeFinalQuiz,
  } = useCourseBuilderStore();

  // Initialize store with initial state
  React.useEffect(() => {
    if (initialState) {
      initialize(initialState);
    }
  }, [initialize, initialState]);

  // 1.1 Map store available data
  const availableLessons: LessonItem[] = storeAvailableLessons.map((l) => ({
    ...l,
    type: "lesson",
  }));
  const availableTopics: TopicItem[] = storeAvailableTopics.map((t) => ({
    ...t,
    type: "topic",
  }));
  const availableQuizzes: QuizItem[] = storeAvailableQuizzes.map((q) => ({
    ...q,
    type: "quiz",
  }));

  // 2. Initialize the DND hook with correct actions
  const { activeItem, handleDragStart, handleDragEnd, handleDragCancel } =
    useCourseBuilderDnd({
      mainContentItems,
      addTopicToLesson,
      addQuizToTopic,
      addQuizToLesson,
      reorderQuizzesInTopic,
      addMainContentItem,
      reorderMainContentItems,
      reorderLessonContentItems,
      availableLessons,
      availableTopics,
      availableQuizzes,
      onAttachLesson: _onAttachLesson,
      courseId: _courseStructure?.id,
      onAttachQuizToLesson,
      onReorderLessons,
      onReorderLessonTopics,
      onReorderLessonQuizzes,
      onReorderTopicQuizzes,
      onAttachTopic: _onAttachTopic,
      onAttachQuizToTopic: _onAttachQuizToTopic,
      onAttachQuizToFinal: _onAttachQuizToFinal,
      onAddQuiz: _onAddQuiz,
      onCreateLessonFromVimeo,
      onCreateTopicFromVimeo,
      onCreateQuizFromVimeo,
    });

  // 3. Set up sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // 4. Define callback for TopBar log button
  const handleLogStructure = () => {
    // Log the unified structure
    console.log("Current Structure:", { mainContentItems });
  };

  const handleRemoveLesson = React.useCallback(
    async (lessonId: string) => {
      try {
        await _onRemoveLesson(lessonId);
        removeLesson(lessonId);
      } catch (error) {
        console.error("Failed to remove lesson", error);
      }
    },
    [_onRemoveLesson, removeLesson],
  );

  const handleRemoveTopic = React.useCallback(
    async (lessonId: string, topicId: string) => {
      try {
        await _onRemoveTopic(topicId);
        removeTopicFromLesson(lessonId, topicId);
      } catch (error) {
        console.error("Failed to remove topic", error);
      }
    },
    [_onRemoveTopic, removeTopicFromLesson],
  );

  const handleRemoveLessonQuiz = React.useCallback(
    async (lessonId: string, quizId: string) => {
      try {
        await _onRemoveQuiz(quizId);
        removeQuizFromLesson(lessonId, quizId);
      } catch (error) {
        console.error("Failed to remove quiz from lesson", error);
      }
    },
    [_onRemoveQuiz, removeQuizFromLesson],
  );

  const handleRemoveTopicQuiz = React.useCallback(
    async (topicId: string, quizId: string) => {
      try {
        await _onRemoveQuiz(quizId);
        removeQuizFromTopic(topicId, quizId);
      } catch (error) {
        console.error("Failed to remove quiz from topic", error);
      }
    },
    [_onRemoveQuiz, removeQuizFromTopic],
  );

  const handleRemoveFinalQuiz = React.useCallback(
    async (quizId: string) => {
      try {
        await _onRemoveQuiz(quizId);
        removeFinalQuiz(quizId);
      } catch (error) {
        console.error("Failed to remove final quiz", error);
      }
    },
    [_onRemoveQuiz, removeFinalQuiz],
  );

  // 5. Render the component structure
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full w-full flex-col">
        <TopBar onLogStructure={handleLogStructure} />

        <div className="flex flex-grow flex-row overflow-hidden">
          <Sidebar
            availableLessons={availableLessons}
            availableTopics={availableTopics}
            availableQuizzes={availableQuizzes}
            renderSidebarItem={renderSidebarItem}
            vimeoVideos={availableVimeoVideos}
            isLoadingVimeoVideos={isLoadingVimeoVideos}
          />
          <MainContent
            // Pass the unified items array
            mainContentItems={mainContentItems}
            activeItem={activeItem}
            onRemoveLesson={handleRemoveLesson}
            onRemoveTopic={handleRemoveTopic}
            onRemoveLessonQuiz={handleRemoveLessonQuiz}
            onRemoveTopicQuiz={handleRemoveTopicQuiz}
            onRemoveFinalQuiz={handleRemoveFinalQuiz}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        <DragOverlayContent
          activeItem={activeItem}
          // Pass data needed by DragOverlayContent
          // It likely needs mainContentItems now instead of lessons/finalQuizzes
          mainContentItems={mainContentItems}
          availableLessons={availableLessons}
          availableTopics={availableTopics}
          availableQuizzes={availableQuizzes}
        />
      </DragOverlay>
    </DndContext>
  );
};

export default CourseBuilder;
