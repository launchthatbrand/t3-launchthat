"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Lock, ShoppingCart, Tag, User } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useContentProtection } from "./ContentProtectionProvider";

interface ProtectedContentProps {
  contentType: string;
  contentId: string;
  children: React.ReactNode;

  // Display options
  fallbackComponent?: React.ReactNode;
  showAccessDetails?: boolean;
  title?: string;

  // Behavior options
  mode?: "strict" | "optimistic"; // strict = block until verified, optimistic = show until denied
  loadingComponent?: React.ReactNode;

  // Access override (for admin testing)
  bypassAccess?: boolean;

  // Performance option
  skipAccessCheck?: boolean; // Skip access check entirely (for public content)
}

/**
 * ProtectedContent - WP Fusion style content protection
 *
 * This component allows granular protection of any content section.
 * Unlike the old AccessGate, this doesn't cause flashing because it:
 * 1. Uses optimistic rendering by default
 * 2. Leverages cached access data from ContentProtectionProvider
 * 3. Only blocks content when explicitly denied
 * 4. Provides options to skip checks for known public content
 */
export const ProtectedContent: React.FC<ProtectedContentProps> = ({
  contentType,
  contentId,
  children,
  fallbackComponent,
  showAccessDetails = true,
  title,
  mode = "optimistic",
  loadingComponent,
  bypassAccess = false,
  skipAccessCheck = false,
}) => {
  const {
    hasAccessToContent,
    getAccessReason,
    isLoading: globalLoading,
    isAuthenticated,
  } = useContentProtection();

  // Skip access check entirely for known public content
  if (skipAccessCheck || bypassAccess) {
    return <>{children}</>;
  }

  // Check access for this specific content
  const hasAccess = hasAccessToContent(contentType, contentId);
  const reason = getAccessReason(contentType, contentId);

  // In strict mode, wait for access verification only if we're still loading globally
  // and we don't have cached access data
  if (mode === "strict" && globalLoading && !hasAccess && !reason) {
    return (
      loadingComponent ?? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner className="mr-2 h-6 w-6" />
          <span className="text-sm text-muted-foreground">
            Verifying access...
          </span>
        </div>
      )
    );
  }

  // Access granted or optimistic mode - render content
  // In optimistic mode, we show content unless we have explicit denial
  if (hasAccess || (mode === "optimistic" && !reason)) {
    return <>{children}</>;
  }

  // Access explicitly denied - show fallback or access denied UI
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return (
    <AccessDeniedCard
      contentType={contentType}
      contentId={contentId}
      reason={reason}
      showAccessDetails={showAccessDetails}
      title={title}
      isAuthenticated={isAuthenticated}
    />
  );
};

interface AccessDeniedCardProps {
  contentType: string;
  contentId: string;
  reason?: string;
  showAccessDetails?: boolean;
  title?: string;
  isAuthenticated: boolean;
}

const AccessDeniedCard: React.FC<AccessDeniedCardProps> = ({
  contentType,
  contentId,
  reason,
  showAccessDetails = true,
  title,
  isAuthenticated,
}) => {
  return (
    <Card className="w-full border-dashed border-orange-200 bg-orange-50/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <Lock className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle className="text-lg text-orange-800">
          {title ?? "Content Protected"}
        </CardTitle>
        <p className="text-sm text-orange-600">
          {reason ?? "This content requires special access"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-gray-600">
              Please log in to access this content
            </p>
            <div className="flex justify-center gap-2">
              <Button asChild>
                <Link href="/sign-in">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sign-up">Create Account</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-gray-600">
              You don't have the required permissions to view this content.
            </p>
            <div className="flex justify-center gap-2">
              <Button asChild>
                <Link href="/store">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Browse Store
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Get Access</Link>
              </Button>
            </div>
          </div>
        )}

        {showAccessDetails && (
          <div className="border-t pt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-700">
              Access Details:
            </h4>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3" />
                <span>Content Type: {contentType}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                <span>Content ID: {contentId}</span>
              </div>
              {reason && (
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  <span>Reason: {reason}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Convenience wrapper for page-level protection
interface ProtectedPageProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  optimistic?: boolean; // Show content optimistically while checking access
}

export const ProtectedPage: React.FC<ProtectedPageProps> = ({
  children,
  fallback,
  requireAuth = false,
  optimistic = true, // Default to optimistic rendering
}) => {
  const { currentPageAccess, isAuthenticated } = useContentProtection();

  // In optimistic mode, show content immediately unless we have explicit denial
  if (optimistic) {
    // Still show content while loading unless we have explicit denial
    if (currentPageAccess.isLoading && !currentPageAccess.reason) {
      return <>{children}</>;
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      return (
        fallback ?? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="mb-2 text-lg font-semibold">
                  Authentication Required
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Please log in to access this page
                </p>
                <Button asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      );
    }

    // Only block if we have explicit access denial
    if (currentPageAccess.reason) {
      return (
        fallback ?? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <Lock className="mx-auto mb-4 h-12 w-12 text-orange-500" />
                <h2 className="mb-2 text-lg font-semibold">
                  Access Restricted
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {currentPageAccess.reason}
                </p>
                <div className="flex justify-center gap-2">
                  <Button asChild>
                    <Link href="/store">Browse Store</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">Go Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      );
    }

    // Default: show content
    return <>{children}</>;
  }

  // Non-optimistic mode (original behavior)
  // Show loading state
  if (currentPageAccess.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return (
      fallback ?? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 text-lg font-semibold">
                Authentication Required
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Please log in to access this page
              </p>
              <Button asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    );
  }

  // Check page-level access
  if (!currentPageAccess.hasAccess) {
    return (
      fallback ?? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <Lock className="mx-auto mb-4 h-12 w-12 text-orange-500" />
              <h2 className="mb-2 text-lg font-semibold">Access Restricted</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                {currentPageAccess.reason ??
                  "You don't have permission to view this page"}
              </p>
              <div className="flex justify-center gap-2">
                <Button asChild>
                  <Link href="/store">Browse Store</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Go Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    );
  }

  return <>{children}</>;
};

// Utility hook for component-level access checks
export function useContentAccess(contentType: string, contentId: string) {
  const { hasAccessToContent, getAccessReason } = useContentProtection();

  return {
    hasAccess: hasAccessToContent(contentType, contentId),
    reason: getAccessReason(contentType, contentId),
  };
}

// Bulk access checker for lists (e.g., course listings)
export function useBulkContentAccess(items: { type: string; id: string }[]) {
  const { checkMultipleAccess } = useContentProtection();

  return checkMultipleAccess(items);
}
