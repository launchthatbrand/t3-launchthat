import {
  AccessRules,
  ContentType,
  UserTag,
  useContentAccess,
} from "~/hooks/useContentAccess";
import { AlertCircle, Lock, Tag, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import React from "react";

interface ProtectedContentProps {
  contentType: ContentType;
  contentId: string;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
  showAccessDetails?: boolean;
  title?: string;
}

/**
 * ProtectedContent wrapper component that checks access rules before rendering content
 */
export const ProtectedContent: React.FC<ProtectedContentProps> = ({
  contentType,
  contentId,
  children,
  fallbackComponent,
  showAccessDetails = true,
  title,
}) => {
  const { hasAccess, isLoading, accessRules, userTags, reason } =
    useContentAccess({
      contentType,
      contentId,
    });

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner className="h-8 w-8" />
          <span className="ml-2">Checking access permissions...</span>
        </CardContent>
      </Card>
    );
  }

  // Access granted - render content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied - render fallback or default access denied UI
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return (
    <AccessDeniedCard
      contentType={contentType}
      reason={reason}
      accessRules={accessRules}
      userTags={userTags}
      showAccessDetails={showAccessDetails}
      title={title}
    />
  );
};

interface AccessDeniedCardProps {
  contentType: ContentType;
  reason?: string;
  accessRules?: AccessRules | null;
  userTags?: UserTag[];
  showAccessDetails?: boolean;
  title?: string;
}

const AccessDeniedCard: React.FC<AccessDeniedCardProps> = ({
  contentType,
  reason,
  accessRules,
  userTags,
  showAccessDetails,
  title,
}) => {
  console.log("userTags", userTags);
  return (
    <Card className="w-full border-destructive">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-destructive">Access Restricted</CardTitle>
        <CardDescription>
          {title ? (
            <>You don't have permission to access "{title}"</>
          ) : (
            <>You don't have permission to access this {contentType}</>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {reason && (
          <div className="flex items-start gap-3 rounded-lg bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Access Denied</p>
              <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
            </div>
          </div>
        )}

        {showAccessDetails && accessRules && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="mb-3 flex items-center gap-2 font-medium">
                <User className="h-4 w-4" />
                Access Requirements
              </h4>

              {accessRules.requiredTags.tagIds.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Required tags (
                    {accessRules.requiredTags.mode === "all"
                      ? "must have ALL"
                      : "must have AT LEAST ONE"}
                    ):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {accessRules.requiredTags.tagIds.map((tagId) => (
                      <Badge
                        key={tagId}
                        variant="outline"
                        className="bg-blue-50"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tagId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {accessRules.excludedTags.tagIds.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Excluded tags (cannot have{" "}
                    {accessRules.excludedTags.mode === "all" ? "ALL" : "ANY"} of
                    these):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {accessRules.excludedTags.tagIds.map((tagId) => (
                      <Badge
                        key={tagId}
                        variant="outline"
                        className="bg-red-50"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        Tag Excluded
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {userTags && userTags.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Your current tags:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {userTags.map((tag, index) => (
                      <Badge
                        key={tag.marketingTag._id}
                        variant="secondary"
                        className="bg-blue-50"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag.marketingTag.name + " " + tag.marketingTag._id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t pt-4">
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/courses">Browse Other Courses</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
