"use client";

import React, { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Lock } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type {
  AccessRules,
  ContentType,
  UserTag} from "~/hooks/useContentAccess";
import {
  useContentAccess
} from "~/hooks/useContentAccess";

// Access context type
interface AccessContextType {
  hasAccess: boolean;
  isLoading: boolean;
  accessRules?: AccessRules;
  reason?: string;
  contentType?: string;
  contentId?: string;
  userTags?: UserTag[];
}

// Create access context
const AccessContext = createContext<AccessContextType>({
  hasAccess: true,
  isLoading: false,
  accessRules: undefined,
});

// Hook to use access context
export const useAccessContext = () => useContext(AccessContext);

// Helper function to extract content info from pathname
function extractContentFromPath(pathname: string): {
  contentType?: ContentType;
  contentId?: string;
  parentContentType?: "course" | "lesson";
  parentContentId?: string;
} {
  // Parse different URL patterns
  const coursePattern = /\/courses\/([^/]+)/;
  const lessonPattern = /\/lesson\/([^/]+)/;
  const topicPattern = /\/topic\/([^/]+)/;
  const downloadPattern = /\/downloads\/([^/]+)/;
  const productPattern = /\/products\/([^/]+)/;

  const courseMatch = coursePattern.exec(pathname);
  const lessonMatch = lessonPattern.exec(pathname);
  const topicMatch = topicPattern.exec(pathname);
  const downloadMatch = downloadPattern.exec(pathname);
  const productMatch = productPattern.exec(pathname);

  // Return the most specific match with parent relationships
  if (topicMatch) {
    return {
      contentType: "topic",
      contentId: topicMatch[1],
      parentContentType: lessonMatch
        ? "lesson"
        : courseMatch
          ? "course"
          : undefined,
      parentContentId: lessonMatch?.[1] ?? courseMatch?.[1],
    };
  }
  if (lessonMatch) {
    return {
      contentType: "lesson",
      contentId: lessonMatch[1],
      parentContentType: courseMatch ? "course" : undefined,
      parentContentId: courseMatch?.[1],
    };
  }
  if (courseMatch) {
    return {
      contentType: "course",
      contentId: courseMatch[1],
    };
  }
  if (downloadMatch) {
    return {
      contentType: "download",
      contentId: downloadMatch[1],
    };
  }
  if (productMatch) {
    return {
      contentType: "product",
      contentId: productMatch[1],
    };
  }

  return {};
}

// Access Denied UI Component
function AccessDeniedUI({
  reason,
  contentType,
  course,
}: {
  reason?: string;
  contentType?: string;
  course?: {
    _id: string;
    title: string;
    productId?: string;
  };
}) {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
      <Card className="mx-auto max-w-md">
        asd
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Access Restrictededed
          </CardTitle>
          {course && (
            <p className="text-sm text-gray-600">
              You don't have permission to access "{course.title}"
            </p>
          )}
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Access Denied</span>
          </div>

          <p className="mb-6 text-gray-600">
            {reason ??
              `You don't have permission to access thisssss ${contentType ?? "content"}.`}
          </p>

          <div className="space-y-3">
            {/* Show Buy Now button if there's a linked product */}
            {course?.productId && (
              <Button
                asChild
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Link href={`/store/product/${course.productId}`}>
                  Buy Now - Get Access to "{course.title}"
                </Link>
              </Button>
            )}

            <Button
              asChild
              className={course?.productId ? "w-full" : "w-full"}
              variant={course?.productId ? "outline" : "primary"}
            >
              <Link href="/auth/sign-in">Sign In to Access Content</Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/courses">Browse Available Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Extract content info from current path
  const { contentType, contentId, parentContentType, parentContentId } =
    extractContentFromPath(pathname);

  // Use the content access hook with cascading logic only if we have content
  const accessResult = useContentAccess(
    contentType && contentId
      ? {
          contentType,
          contentId,
          parentContentType,
          parentContentId,
        }
      : {
          contentType: "course" as ContentType,
          contentId: "skip", // Use a skip-like value to prevent actual query
        },
  );

  // Provide access context to all child components
  const contextValue: AccessContextType = {
    hasAccess: contentType && contentId ? accessResult.hasAccess : true, // Default to allow for non-content pages
    isLoading: contentType && contentId ? accessResult.isLoading : false,
    accessRules: accessResult.accessRules,
    reason: accessResult.reason,
    contentType,
    contentId,
    userTags: accessResult.userTags,
  };

  // Show loading spinner during access check
  if (contextValue.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="mt-2 text-sm text-gray-600">
            Checking access permissions...
          </p>
        </div>
      </div>
    );
  }

  // Show access denied UI if user doesn't have access
  if (contentType && contentId && !contextValue.hasAccess) {
    return (
      <AccessContext.Provider value={contextValue}>
        <AccessDeniedUI
          reason={contextValue.reason}
          contentType={contentType}
          course={accessResult.course}
        />
      </AccessContext.Provider>
    );
  }

  return (
    <AccessContext.Provider value={contextValue}>
      <div>{children}</div>
    </AccessContext.Provider>
  );
}
