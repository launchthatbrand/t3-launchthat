// Create a new content protection provider
"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import { useConvexUser } from "~/hooks/useConvexUser";

interface ContentAccess {
  contentType: string;
  contentId: string;
  hasAccess: boolean;
  reason?: string;
  rules?: any;
}

interface ContentProtectionContextType {
  // Core access checking
  hasAccessToContent: (contentType: string, contentId: string) => boolean;
  getAccessReason: (
    contentType: string,
    contentId: string,
  ) => string | undefined;

  // Bulk access checking for performance
  checkMultipleAccess: (
    items: { type: string; id: string }[],
  ) => Record<string, boolean>;

  // User state
  userId?: string;
  userTags: string[];
  isAuthenticated: boolean;
  isLoading: boolean;

  // Content management
  refreshAccess: () => void;

  // Current page access (for layout-level decisions)
  currentPageAccess: {
    hasAccess: boolean;
    isLoading: boolean;
    reason?: string;
  };
}

const ContentProtectionContext =
  createContext<ContentProtectionContextType | null>(null);

export function useContentProtection() {
  const context = useContext(ContentProtectionContext);
  if (!context) {
    throw new Error(
      "useContentProtection must be used within ContentProtectionProvider",
    );
  }
  return context;
}

interface ContentProtectionProviderProps {
  children: React.ReactNode;
}

export function ContentProtectionProvider({
  children,
}: ContentProtectionProviderProps) {
  const { convexId: userId, isLoading: userLoading } = useConvexUser();
  const pathname = usePathname();
  const [accessCache, setAccessCache] = useState<Record<string, ContentAccess>>(
    {},
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Get user's marketing tags
  // TODO: Restore marketing tags functionality after users refactor
  const userTags = useQuery(
    api.users.marketingTags.index.getUserMarketingTags,
    userId ? { userId } : "skip",
  );

  // Stable user tag IDs to prevent unnecessary re-renders
  const userTagIds = useMemo(
    () => (userTags ?? []).map((tag) => tag.marketingTag._id),
    [userTags],
  );

  // Extract current page content info (memoized to prevent re-computation)
  const currentPageContent = useMemo(
    () => extractContentFromPath(pathname),
    [pathname],
  );

  // Pre-load access for current page content (only when we have content)
  const shouldLoadPageRules = !!(
    currentPageContent.contentType && currentPageContent.contentId
  );
  const currentPageRules = useQuery(
    api.lms.contentAccess.queries.getContentAccessRules,
    shouldLoadPageRules
      ? {
          contentType: currentPageContent.contentType,
          contentId: currentPageContent.contentId,
        }
      : "skip",
  );

  // Calculate current page access (memoized to prevent flashing)
  const currentPageAccess = useMemo(() => {
    // Always allow access if no content type (e.g., homepage, general pages)
    if (!currentPageContent.contentType || !currentPageContent.contentId) {
      return { hasAccess: true, isLoading: false };
    }

    // Still loading user or rules
    if (
      userLoading ||
      (shouldLoadPageRules && currentPageRules === undefined)
    ) {
      return { hasAccess: true, isLoading: true }; // Optimistic: show content while loading
    }

    // No rules = public access
    if (!currentPageRules) {
      return { hasAccess: true, isLoading: false };
    }

    // Check access with current rules
    const hasAccess = checkTagAccess(currentPageRules, userTagIds, !!userId);

    return {
      hasAccess,
      isLoading: false,
      reason: hasAccess
        ? undefined
        : getAccessDeniedReason(currentPageRules, !!userId),
    };
  }, [
    userLoading,
    currentPageRules,
    userTagIds,
    userId,
    currentPageContent,
    shouldLoadPageRules,
  ]);

  // Cache page access to prevent re-queries on the same content
  useEffect(() => {
    if (
      currentPageContent.contentType &&
      currentPageContent.contentId &&
      !currentPageAccess.isLoading
    ) {
      const cacheKey = `${currentPageContent.contentType}:${currentPageContent.contentId}`;
      setAccessCache((prev) => ({
        ...prev,
        [cacheKey]: {
          contentType: currentPageContent.contentType!,
          contentId: currentPageContent.contentId!,
          hasAccess: currentPageAccess.hasAccess,
          reason: currentPageAccess.reason,
          rules: currentPageRules,
        },
      }));
    }
  }, [currentPageContent, currentPageAccess, currentPageRules]);

  // Core access checking function (memoized)
  const hasAccessToContent = useCallback(
    (contentType: string, contentId: string): boolean => {
      const cacheKey = `${contentType}:${contentId}`;
      const cached = accessCache[cacheKey];

      if (cached) {
        return cached.hasAccess;
      }

      // Default to true (optimistic) for uncached content
      // This prevents blocking UI while access is being checked
      return true;
    },
    [accessCache],
  );

  const getAccessReason = useCallback(
    (contentType: string, contentId: string): string | undefined => {
      const cacheKey = `${contentType}:${contentId}`;
      const cached = accessCache[cacheKey];
      return cached?.reason;
    },
    [accessCache],
  );

  const checkMultipleAccess = useCallback(
    (items: { type: string; id: string }[]): Record<string, boolean> => {
      const result: Record<string, boolean> = {};
      items.forEach((item) => {
        result[`${item.type}:${item.id}`] = hasAccessToContent(
          item.type,
          item.id,
        );
      });
      return result;
    },
    [hasAccessToContent],
  );

  const refreshAccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setAccessCache({});
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ContentProtectionContextType>(
    () => ({
      hasAccessToContent,
      getAccessReason,
      checkMultipleAccess,
      userId,
      userTags: userTagIds,
      isAuthenticated: !!userId,
      isLoading: userLoading,
      refreshAccess,
      currentPageAccess,
    }),
    [
      hasAccessToContent,
      getAccessReason,
      checkMultipleAccess,
      userId,
      userTagIds,
      userLoading,
      refreshAccess,
      currentPageAccess,
    ],
  );

  return (
    <ContentProtectionContext.Provider value={contextValue}>
      {children}
    </ContentProtectionContext.Provider>
  );
}

// Helper functions (moved outside component to prevent recreation)
function extractContentFromPath(pathname: string) {
  const coursePattern = /\/courses\/([^/]+)/;
  const lessonPattern = /\/lesson\/([^/]+)/;
  const topicPattern = /\/topic\/([^/]+)/;

  const topicMatch = topicPattern.exec(pathname);
  const lessonMatch = lessonPattern.exec(pathname);
  const courseMatch = coursePattern.exec(pathname);

  if (topicMatch) {
    return { contentType: "topic", contentId: topicMatch[1] };
  }
  if (lessonMatch) {
    return { contentType: "lesson", contentId: lessonMatch[1] };
  }
  if (courseMatch) {
    return { contentType: "course", contentId: courseMatch[1] };
  }

  return {};
}

function checkTagAccess(
  rules: any,
  userTagIds: string[],
  isAuthenticated: boolean,
): boolean {
  if (!rules) return true;
  if (rules.isPublic) return true;

  if (!isAuthenticated) return false;

  // Check required tags
  if (rules.requiredTags.tagIds.length > 0) {
    const hasRequiredTags =
      rules.requiredTags.mode === "all"
        ? rules.requiredTags.tagIds.every((tagId: string) =>
            userTagIds.includes(tagId),
          )
        : rules.requiredTags.tagIds.some((tagId: string) =>
            userTagIds.includes(tagId),
          );

    if (!hasRequiredTags) return false;
  }

  // Check excluded tags
  if (rules.excludedTags.tagIds.length > 0) {
    const hasExcludedTags =
      rules.excludedTags.mode === "all"
        ? rules.excludedTags.tagIds.every((tagId: string) =>
            userTagIds.includes(tagId),
          )
        : rules.excludedTags.tagIds.some((tagId: string) =>
            userTagIds.includes(tagId),
          );

    if (hasExcludedTags) return false;
  }

  return true;
}

function getAccessDeniedReason(rules: any, isAuthenticated: boolean): string {
  if (!isAuthenticated) {
    return "Please log in to access this content";
  }
  if (rules.requiredTags.tagIds.length > 0) {
    return `Missing required tags (need ${rules.requiredTags.mode === "all" ? "ALL" : "at least one"} of the specified tags)`;
  }
  return "Access denied due to content restrictions";
}
