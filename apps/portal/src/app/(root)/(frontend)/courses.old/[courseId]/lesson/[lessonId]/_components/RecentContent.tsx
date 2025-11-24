import React from "react";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Doc } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";

import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { OverlayCard } from "../topic/[topicId]/page";

interface RecentContentProps {
  lesson: Doc<"lessons">;
  topic: Doc<"topics">;
  course: Doc<"courses">;
  limit?: number;
}

const RecentContent: React.FC<RecentContentProps> = ({
  course,
  lesson,
  topic,
  limit = 6,
}) => {
  const router = useRouter();
  const courseId = course._id;

  const recentContent = useQuery(api.lms.courses.queries.getRecentContent, {
    currentLessonId: lesson._id,
    currentTopicId: topic._id,
    limit,
  });

  if (recentContent === undefined) {
    return <LoadingSpinner />;
  }

  if (recentContent.lessons.length === 0 && recentContent.topics.length === 0) {
    return <div>No recent content found.</div>;
  }

  return (
    <div className="space-y-4">
      {/* {recentContent.lessons.length > 0 && (
        <div>
          <h4 className="mb-3 text-base font-medium text-muted-foreground">
            Recent Lessons
          </h4>
          <ul className="list-disc space-y-1 pl-5">
            {recentContent.lessons.map((item) => (
              <li key={item._id} className="text-sm">
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
      )} */}

      {recentContent.topics.length > 0 && (
        <div>
          <h4 className="mb-3 text-base font-medium text-muted-foreground">
            Recent Topics
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentContent.topics.map((item) => (
              <OverlayCard
                item={item}
                key={item._id}
                className="text-xs"
                onClick={() => {
                  router.push(
                    `/courses/${courseId}/lesson/${item.lessonId}/topic/${item._id}`,
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentContent;
