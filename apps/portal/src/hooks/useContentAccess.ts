import { Id } from "@convex-config/_generated/dataModel";
import { api } from "@convex-config/_generated/api";
import { useConvexUser } from "./useConvexUser";
import { useQuery } from "convex/react";

export type ContentType =
  | "course"
  | "lesson"
  | "topic"
  | "download"
  | "product"
  | "quiz";

export interface UseContentAccessProps {
  contentType: ContentType;
  contentId: string;
  parentContentType?: "course" | "lesson";
  parentContentId?: string;
}

export interface AccessRules {
  requiredTags: {
    mode: "all" | "some";
    tagIds: Id<"marketingTags">[];
  };
  excludedTags: {
    mode: "all" | "some";
    tagIds: Id<"marketingTags">[];
  };
  isPublic?: boolean;
}

export interface UserTag {
  marketingTagId: Id<"marketingTags">;
  userId: Id<"users">;
  assignedBy?: Id<"users">;
  source?: string;
  expiresAt?: number;
  _id: Id<"marketingTags">;
  marketingTag: {
    _id: Id<"marketingTags">;
    name: string;
  };
}

export interface ContentAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  accessRules?: AccessRules;
  userTags?: UserTag[];
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
  const { convexId: userId, isLoading: userLoading } = useConvexUser();

  // Normalize params for hooks so hooks are not conditional
  const normalizedContentId = contentId || "";
  const parentQueryParams =
    parentContentType && parentContentId
      ? {
          contentType: parentContentType,
          contentId: parentContentId,
        }
      : ("skip" as const);

  const courseQueryParams = (() => {
    if (contentType === "course" && normalizedContentId) {
      return { courseId: normalizedContentId as Id<"courses"> };
    }
    if (parentContentType === "course" && parentContentId) {
      return { courseId: parentContentId as Id<"courses"> };
    }
    return "skip" as const;
  })();

  // Hooks (never conditional)
  const contentRules = useQuery(
    api.lms.contentAccess.queries.getContentAccessRules,
    normalizedContentId
      ? {
          contentType,
          contentId: normalizedContentId,
        }
      : ("skip" as const),
  );

  const parentRules = useQuery(
    api.lms.contentAccess.queries.getContentAccessRules,
    parentQueryParams,
  );

  const courseInfo = useQuery(
    api.lms.courses.queries.getCourse,
    courseQueryParams,
  );

  const userTags = useQuery(
    api.users.marketingTags.index.getUserMarketingTags,
    userId ? { userId } : ("skip" as const),
  );

  // Early return for invalid or empty content IDs
  if (!normalizedContentId || normalizedContentId === "skip") {
    return {
      hasAccess: true,
      isLoading: false,
    };
  }

  // Helper function to check if user meets tag requirements
  const checkTagAccess = (
    rules: AccessRules | undefined,
    userTagIds: string[],
  ) => {
    if (!rules) return true; // No rules = public access

    // If explicitly marked as public, allow access
    if (rules.isPublic) return true;

    // Check required tags
    if (rules.requiredTags.tagIds.length > 0) {
      const hasRequiredTags =
        rules.requiredTags.mode === "all"
          ? rules.requiredTags.tagIds.every((tagId) =>
              userTagIds.includes(tagId),
            )
          : rules.requiredTags.tagIds.some((tagId) =>
              userTagIds.includes(tagId),
            );

      if (!hasRequiredTags) {
        return false;
      }
    }

    // Check excluded tags
    if (rules.excludedTags.tagIds.length > 0) {
      const hasExcludedTags =
        rules.excludedTags.mode === "all"
          ? rules.excludedTags.tagIds.every((tagId) =>
              userTagIds.includes(tagId),
            )
          : rules.excludedTags.tagIds.some((tagId) =>
              userTagIds.includes(tagId),
            );

      if (hasExcludedTags) {
        return false;
      }
    }

    return true;
  };

  // Main access logic
  const isLoading = userLoading || contentRules === undefined;

  if (isLoading) {
    return {
      hasAccess: false,
      isLoading: true,
    };
  }

  // Extract user tag IDs
  const userTagIds = (userTags ?? []).map(
    (tag: UserTag) => tag.marketingTag._id,
  );

  // Check content-specific rules first
  if (contentRules) {
    const hasAccess = userId
      ? checkTagAccess(contentRules as unknown as AccessRules, userTagIds)
      : (contentRules as unknown as AccessRules).isPublic;

    if (!hasAccess) {
      const rules = contentRules as unknown as AccessRules;
      const reason = !userId
        ? "Please log in to access this content"
        : rules.requiredTags.tagIds.length > 0
          ? `Missing required tags (need ${rules.requiredTags.mode === "all" ? "ALL" : "at least one"} of the specified tags)`
          : "Access denied due to excluded tags";

      return {
        hasAccess: false,
        isLoading: false,
        accessRules: rules,
        userTags,
        reason,
        course: courseInfo
          ? {
              _id: courseInfo._id,
              title: courseInfo.title,
              productId: courseInfo.productId,
            }
          : undefined,
      };
    }

    // Has access based on content rules
    return {
      hasAccess: true,
      isLoading: false,
      accessRules: contentRules as unknown as AccessRules,
      userTags,
      course: courseInfo
        ? {
            _id: courseInfo._id,
            title: courseInfo.title,
            productId: courseInfo.productId,
          }
        : undefined,
    };
  }

  // Check parent rules for cascading access
  if (parentRules) {
    const rules = parentRules as unknown as AccessRules;
    const hasAccess = userId
      ? checkTagAccess(rules, userTagIds)
      : rules.isPublic;

    if (!hasAccess) {
      const reason = !userId
        ? "Please log in to access this content"
        : rules.requiredTags.tagIds.length > 0
          ? `Missing required tags from parent content (need ${rules.requiredTags.mode === "all" ? "ALL" : "at least one"} of the specified tags)`
          : "Access denied due to parent content restrictions";

      return {
        hasAccess: false,
        isLoading: false,
        accessRules: rules,
        userTags,
        reason,
        course: courseInfo
          ? {
              _id: courseInfo._id,
              title: courseInfo.title,
              productId: courseInfo.productId,
            }
          : undefined,
      };
    }

    // Has access based on parent rules
    return {
      hasAccess: true,
      isLoading: false,
      accessRules: rules,
      userTags,
      course: courseInfo
        ? {
            _id: courseInfo._id,
            title: courseInfo.title,
            productId: courseInfo.productId,
          }
        : undefined,
    };
  }

  // No rules found - default to public access
  return {
    hasAccess: true,
    isLoading: false,
    course: courseInfo
      ? {
          _id: courseInfo._id,
          title: courseInfo.title,
          productId: courseInfo.productId,
        }
      : undefined,
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
