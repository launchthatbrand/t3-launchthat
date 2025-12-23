import React from "react";

import { DraggableItem } from "@acme/dnd";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";

import type { VimeoVideoItem } from "../CourseBuilder";
import type { SidebarItemRenderer } from "../types/callbacks";
import type {
  CertificateItem,
  LessonItem,
  QuizItem,
  TopicItem,
} from "../types/content";
import type { SidebarItem } from "../types/navigation";

interface SidebarProps {
  availableLessons: LessonItem[];
  availableTopics: TopicItem[];
  availableQuizzes: QuizItem[];
  availableCertificates: CertificateItem[];
  renderSidebarItem?: SidebarItemRenderer<SidebarItem>;
  vimeoVideos?: VimeoVideoItem[];
  isLoadingVimeoVideos?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  availableLessons,
  availableTopics,
  availableQuizzes,
  availableCertificates,
  renderSidebarItem,
  vimeoVideos,
  isLoadingVimeoVideos,
}) => {
  const renderVimeoSection = (
    label: string,
    baseType: "lesson" | "topic" | "quiz",
    emptyLabel: string,
  ) => {
    if (!vimeoVideos || vimeoVideos.length === 0) {
      if (isLoadingVimeoVideos) {
        return (
          <p className="text-muted-foreground mt-2 text-xs">
            Loading Vimeo videos…
          </p>
        );
      }
      return <p className="text-muted-foreground mt-2 text-xs">{emptyLabel}</p>;
    }

    return (
      <>
        <p className="text-muted-foreground mt-3 mb-1 text-[11px] font-semibold tracking-wide uppercase">
          {label}
        </p>
        {vimeoVideos.map((video) => (
          <DraggableItem
            key={`${baseType}-${video.videoId}`}
            id={`${baseType}-vimeo-${video.videoId}`}
            type={baseType}
            className="bg-card mb-1 rounded border p-2 text-xs shadow-sm"
            data={{
              vimeoVideo: video,
              fromVimeo: true,
              vimeoContentType: baseType,
              label: video.title,
            }}
          >
            <span className="font-medium">{video.title}</span>
            {video.description && (
              <p className="text-muted-foreground mt-1 text-[11px]">
                {video.description.slice(0, 60)}
                {video.description.length > 60 ? "…" : ""}
              </p>
            )}
          </DraggableItem>
        ))}
      </>
    );
  };

  return (
    <div className="bg-muted/10 w-64 shrink-0 overflow-y-auto border-r p-4">
      <h2 className="mb-4 text-lg font-semibold">Available Items</h2>

      <Accordion
        type="multiple"
        // Default values to make all sections open initially
        defaultValue={[
          "available-lessons",
          "available-topics",
          "available-quizzes",
          "available-certificates",
        ]}
        className="w-full"
      >
        {/* Available Lessons Section */}
        <AccordionItem value="available-lessons" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Lessons ({availableLessons.length})
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            {availableLessons.length === 0 && (
              <p className="text-muted-foreground text-xs">
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
                  className="bg-card mb-1 rounded border p-2 text-sm shadow-sm"
                  data={{ label: lesson.title }}
                >
                  {lesson.title}
                </DraggableItem>
              ),
            )}
            {renderVimeoSection("Vimeo videos", "lesson", "No Vimeo videos")}
          </AccordionContent>
        </AccordionItem>

        {/* Available Topics Section */}
        <AccordionItem value="available-topics" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Topics ({availableTopics.length})
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            {availableTopics.length === 0 && (
              <p className="text-muted-foreground text-xs">
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
                  className="bg-card mb-1 rounded border p-2 text-sm shadow-sm"
                  data={{ label: topic.title }}
                >
                  {topic.title}
                </DraggableItem>
              ),
            )}
            {renderVimeoSection("Vimeo videos", "topic", "No Vimeo videos")}
          </AccordionContent>
        </AccordionItem>

        {/* Available Quizzes Section */}
        <AccordionItem value="available-quizzes" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Quizzes ({availableQuizzes.length})
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            {availableQuizzes.length === 0 && (
              <p className="text-muted-foreground text-xs">
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
                  className="bg-card mb-1 rounded border p-2 text-xs shadow-sm"
                  data={{ label: quiz.title }}
                >
                  {quiz.title}
                </DraggableItem>
              ),
            )}
            {renderVimeoSection("Vimeo videos", "quiz", "No Vimeo videos")}
          </AccordionContent>
        </AccordionItem>

        {/* Available Certificates Section */}
        <AccordionItem value="available-certificates" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            Certificates ({availableCertificates?.length})
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            {availableCertificates?.length === 0 && (
              <p className="text-muted-foreground text-xs">
                No certificates available.
              </p>
            )}
            {availableCertificates?.map((certificate) => (
              <DraggableItem
                key={certificate.id}
                id={certificate.id}
                type="certificate"
                className="bg-card mb-1 rounded border p-2 text-xs shadow-sm"
                data={{ label: certificate.title }}
              >
                {certificate.title}
              </DraggableItem>
            ))}
            <div className="mt-2">
              <a
                href="/admin/edit?post_type=certificates&post_id=new"
                className="text-xs font-medium underline underline-offset-4"
              >
                Create certificate
              </a>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Sidebar;
