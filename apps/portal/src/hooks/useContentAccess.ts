import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";

import { useConvexUser } from "./useConvexUser";
import { useTenant } from "~/context/TenantContext";
import { PORTAL_TENANT_SLUG } from "~/lib/tenant-fetcher";
import { evaluateContentAccess } from "~/lib/access/contentAccessRegistry";

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
    tagIds: string[];
  };
  excludedTags: {
    mode: "all" | "some";
    tagIds: string[];
  };
  isPublic?: boolean;
}

export type ContactTagAssignment = {
  marketingTag: { _id: string; slug: string; name: string };
};

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
  const { convexId: userId, isLoading: userLoading } = useConvexUser();
  const tenant = useTenant();
  const crmOrganizationId =
    tenant?.slug === PORTAL_TENANT_SLUG ? PORTAL_TENANT_SLUG : tenant?._id ?? null;

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
    api.plugins.lms.contentAccess.queries.getContentAccessRules,
    normalizedContentId
      ? {
          contentType,
          contentId: normalizedContentId,
        }
      : ("skip" as const),
  );

  const parentRules = useQuery(
    api.plugins.lms.contentAccess.queries.getContentAccessRules,
    parentQueryParams,
  );

  const courseInfo = useQuery(
    api.lms.courses.queries.getCourse,
    courseQueryParams,
  );

  const crmEnabledOption = useQuery(
    api.core.options.get,
    crmOrganizationId
      ? ({
          metaKey: "plugin_crm_enabled",
          type: "site",
          orgId: tenant?.slug === PORTAL_TENANT_SLUG ? undefined : (crmOrganizationId as any),
        } as const)
      : ("skip" as const),
  ) as { metaValue?: unknown } | null | undefined;
  const crmEnabled = Boolean(crmEnabledOption?.metaValue);

  const contactId = useQuery(
    api.core.crm.identity.queries.getContactIdForUser,
    crmEnabled && userId && crmOrganizationId
      ? ({ organizationId: crmOrganizationId, userId } as any)
      : ("skip" as const),
  );

  const contactTags = useQuery(
    api.core.crm.marketingTags.index.getContactMarketingTags,
    crmEnabled && crmOrganizationId && contactId
      ? ({ organizationId: crmOrganizationId, contactId } as any)
      : ("skip" as const),
  );

  // Early return for invalid or empty content IDs
  if (!normalizedContentId || normalizedContentId === "skip") {
    return {
      hasAccess: true,
      isLoading: false,
    };
  }

  // Main access logic
  const isLoading = userLoading || contentRules === undefined;

  if (isLoading) {
    return {
      hasAccess: false,
      isLoading: true,
    };
  }

  const tagKeys = (contactTags ?? []).flatMap((assignment: any) => {
    const tag = assignment?.marketingTag;
    const slug = typeof tag?.slug === "string" ? tag.slug : undefined;
    const id = typeof tag?._id === "string" ? tag._id : undefined;
    return [slug, id].filter(Boolean) as string[];
  });

  const decision = crmEnabled
    ? evaluateContentAccess({
        subject: {
          organizationId: crmOrganizationId,
          enabledPluginIds: crmEnabled ? ["crm"] : [],
          userId: userId ?? null,
          contactId: (contactId as any) ?? null,
          isAuthenticated: Boolean(userId),
        },
        resource: {
          contentType,
          contentId: normalizedContentId,
          parent:
            parentContentType && parentContentId
              ? { contentType: parentContentType, contentId: parentContentId }
              : null,
        },
        data: {
          contentRules: contentRules as any,
          parentRules: parentRules as any,
          tagKeys,
        },
      })
    : { kind: "abstain" as const };

  if (decision.kind === "deny" || decision.kind === "redirect") {
    const rules = (contentRules ?? parentRules) as unknown as AccessRules | undefined;
    return {
      hasAccess: false,
      isLoading: false,
      accessRules: rules,
      userTags: contactTags as any,
      reason: decision.reason ?? "Access denied",
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
