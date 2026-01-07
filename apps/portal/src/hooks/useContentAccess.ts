// NOTE: Client-side content access checks used to be driven by LMS rule tables
// and CRM contact tag queries. Access control is now enforced on the server
// during frontend route resolution (see `registerCoreRouteHandlers.tsx`) using
// postmeta-backed `content_access` rules.
//
// This hook is retained for compatibility with older UI components, but it is
// intentionally conservative: it never blocks rendering on the client.
import type { Id } from "@convex-config/_generated/dataModel";

export interface UseContentAccessProps {
  contentType: ContentType;
  contentId: string;
  parentContentType?: "course" | "lesson";
  parentContentId?: string;
}

export type ContentType =
  | "course"
  | "lesson"
  | "topic"
  | "download"
  | "product"
  | "quiz"
  | "post";

export interface AccessRules {
  requiredTags: {
    mode: "all" | "some";
    tagIds: string[];
  };
  excludedTags: {
    mode: "all" | "some";
    tagIds: string[];
  };
  isPublic?: boolean;
}

export interface ContactTagAssignment {
  marketingTag: { _id: string; slug: string; name: string };
}

export type UserTag = ContactTagAssignment;

export interface ContentAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  accessRules?: AccessRules;
  userTags?: ContactTagAssignment[];
  reason?: string;
  course?: {
    _id: Id<"courses">;
    title: string;
    productId?: string;
  };
}

/**
 * Hook to check if the current user has access to specific content
 * based on marketing tag rules with cascading logic
 */
export const useContentAccess = ({
  contentType,
  contentId,
  parentContentType,
  parentContentId,
}: UseContentAccessProps): ContentAccessResult => {
  void contentType;
  void contentId;
  void parentContentType;
  void parentContentId;
  return {
    hasAccess: true,
    isLoading: false,
  };
};

// Convenience hooks for specific content types
export const useCourseAccess = (courseId: string) =>
  useContentAccess({ contentType: "course", contentId: courseId });

export const useLessonAccess = (lessonId: string, courseId?: string) =>
  useContentAccess({
    contentType: "lesson",
    contentId: lessonId,
    parentContentType: courseId ? "course" : undefined,
    parentContentId: courseId,
  });

export const useTopicAccess = (
  topicId: string,
  lessonId?: string,
  courseId?: string,
) =>
  useContentAccess({
    contentType: "topic",
    contentId: topicId,
    parentContentType: lessonId ? "lesson" : courseId ? "course" : undefined,
    parentContentId: lessonId ?? courseId,
  });
