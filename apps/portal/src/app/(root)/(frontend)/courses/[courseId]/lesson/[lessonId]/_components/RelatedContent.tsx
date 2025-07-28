import React from "react";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Doc } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent } from "@acme/ui/card";

import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { OverlayCard } from "../topic/[topicId]/page";

// import { OverlayCard } from "../topic/[topicId]/page"; // No longer directly used here for related content

interface RelatedContentProps {
  lesson: Doc<"lessons">;
  topic: Doc<"topics">;
  course: Doc<"courses">;
}

const RelatedContent: React.FC<RelatedContentProps> = ({
  course,
  lesson,
  topic,
}) => {
  const currentTagIds = lesson.tagIds ?? topic.tagIds ?? [];

  const router = useRouter();

  const courseId = course._id;

  const relatedContent = useQuery(
    api.lms.courses.queries.getRelatedContentByTagIds,
    currentTagIds.length > 0
      ? {
          tagIds: currentTagIds,
          currentLessonId: lesson._id,
          currentTopicId: topic._id,
        }
      : "skip",
  );

  if (
    relatedContent &&
    relatedContent.lessons.length === 0 &&
    relatedContent.topics.length === 0
  ) {
    return <div>No related content found.</div>;
  }
  if (relatedContent === undefined) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {relatedContent.lessons.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">Related Lessons</h3>
          <ul className="list-disc pl-5">
            {relatedContent.lessons.map((item) => (
              <li key={item._id} className="mt-2">
                <a
                  href={`/courses/${item.courseId}/lesson/${item._id}`}
                  className="text-blue-600 hover:underline"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {relatedContent.topics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {relatedContent.topics.map((item) => (
            <OverlayCard
              item={item}
              key={item._id}
              onClick={() => {
                router.push(
                  `/courses/${courseId}/lesson/${item.lessonId}/topic/${item._id}`,
                );
              }}
            />
            //   <li key={item._id} className="mt-2">
            //     <a
            //       href={`/courses/${item.lessonId}/lesson/${item._id}`}
            //       className="text-blue-600 hover:underline"
            //     >
            //       {item.title}
            //     </a>
            //     {item.tagNames && item.tagNames.length > 0 && (
            //       <Badge className="ml-2">{item.tagNames.join(", ")}</Badge>
            //     )}
            //   </li>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedContent;
