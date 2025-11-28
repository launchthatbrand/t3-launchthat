import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";

import type { SidebarItemRenderer } from "../types/callbacks";
import type { LessonItem, QuizItem, TopicItem } from "../types/content";
import type { SidebarItem } from "../types/navigation";
import DraggableItem from "./DraggableItem";

interface SidebarProps {
  availableLessons: LessonItem[];
  availableTopics: TopicItem[];
  availableQuizzes: QuizItem[];
  renderSidebarItem?: SidebarItemRenderer<SidebarItem>;
}

const Sidebar: React.FC<SidebarProps> = ({
  availableLessons,
  availableTopics,
  availableQuizzes,
  renderSidebarItem,
}) => {
  return (
    <div className="w-64 flex-shrink-0 overflow-y-auto border-r bg-muted/10 p-4">
      <h2 className="mb-4 text-lg font-semibold">Available Items</h2>

      <Accordion
        type="multiple"
        // Default values to make all sections open initially
        defaultValue={[
          "available-lessons",
          "available-topics",
          "available-quizzes",
        ]}
        className="w-full"
      >
        {/* Available Lessons Section */}
        <AccordionItem value="available-lessons" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Lessons ({availableLessons.length})
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-1">
            {availableLessons.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No lessons available.
              </p>
            )}
            {availableLessons.map((lesson) =>
              renderSidebarItem ? (
                renderSidebarItem({
                  id: lesson.id,
                  label: lesson.title,
                  type: "lesson",
                  state: "active",
                  children: [],
                })
              ) : (
                <DraggableItem
                  key={lesson.id}
                  id={lesson.id}
                  type="lesson"
                  className="mb-1 rounded border bg-card p-2 text-sm shadow-sm"
                >
                  {lesson.title}
                </DraggableItem>
              ),
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Available Topics Section */}
        <AccordionItem value="available-topics" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Topics ({availableTopics.length})
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-1">
            {availableTopics.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No topics available.
              </p>
            )}
            {availableTopics.map((topic) =>
              renderSidebarItem ? (
                renderSidebarItem({
                  id: topic.id,
                  label: topic.title,
                  type: "topic",
                  state: "active",
                  children: [],
                })
              ) : (
                <DraggableItem
                  key={topic.id}
                  id={topic.id}
                  type="topic"
                  className="mb-1 rounded border bg-card p-2 text-sm shadow-sm"
                >
                  {topic.title}
                </DraggableItem>
              ),
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Available Quizzes Section */}
        <AccordionItem value="available-quizzes" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Quizzes ({availableQuizzes.length})
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-1">
            {availableQuizzes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No quizzes available.
              </p>
            )}
            {availableQuizzes.map((quiz) =>
              renderSidebarItem ? (
                renderSidebarItem({
                  id: quiz.id,
                  label: quiz.title,
                  type: "quiz",
                  state: "active",
                  children: [],
                })
              ) : (
                <DraggableItem
                  key={quiz.id}
                  id={quiz.id}
                  type="quiz"
                  className="mb-1 rounded border bg-card p-2 text-xs shadow-sm"
                >
                  {quiz.title}
                </DraggableItem>
              ),
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Sidebar;
