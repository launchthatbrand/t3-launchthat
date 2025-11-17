"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Crown, Lock, Star } from "lucide-react";
import {
  useMarketingTagAccess,
  useUserMarketingTags,
} from "~/hooks/useMarketingTags";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { ReactNode } from "react";

interface TagBasedAccessProps {
  /** Array of tag slugs that grant access to this content */
  requiredTags: string[];
  /** Whether user must have ALL tags (true) or ANY tag (false) */
  requireAll?: boolean;
  /** Content to show when user has access */
  children: ReactNode;
  /** Custom fallback content when access is denied */
  fallback?: ReactNode;
  /** Title for the access card */
  title?: string;
  /** Description for the access requirements */
  description?: string;
}

export function TagBasedAccess({
  requiredTags,
  requireAll = false,
  children,
  fallback,
  title,
  description,
}: TagBasedAccessProps) {
  const { hasAccess, matchingTags, missingTags, isLoading } =
    useMarketingTagAccess(requiredTags, requireAll);

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-6">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback content or default access denied message
  return (
    fallback || (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Lock className="h-5 w-5" />
            {title || "Access Restricted"}
          </CardTitle>
          <CardDescription>
            {description ||
              `You need ${requireAll ? "all" : "one"} of the following access levels to view this content:`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {requiredTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={matchingTags.includes(tag) ? "default" : "outline"}
                  className={matchingTags.includes(tag) ? "bg-green-500" : ""}
                >
                  {tag.replace("-", " ")}
                  {matchingTags.includes(tag) && " ✓"}
                </Badge>
              ))}
            </div>

            {matchingTags.length > 0 && (
              <p className="text-sm text-muted-foreground">
                ✓ You have: {matchingTags.join(", ")}
              </p>
            )}

            {missingTags.length > 0 && (
              <p className="text-sm text-destructive">
                ✗ You need: {missingTags.join(", ")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  );
}

/**
 * Component to show user's current marketing tags
 */
export function UserMarketingTagsBadges() {
  const { userTags, isLoading } = useUserMarketingTags();

  if (isLoading) {
    return <div className="animate-pulse">Loading tags...</div>;
  }

  if (!userTags || userTags.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No marketing tags assigned
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {userTags.map((userTag) => (
        <Badge
          key={userTag._id}
          variant="outline"
          className="flex items-center gap-1"
          style={{ borderColor: userTag.marketingTag.color }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: userTag.marketingTag.color }}
          />
          {userTag.marketingTag.name}
          {userTag.marketingTag.category && (
            <span className="text-xs opacity-60">
              ({userTag.marketingTag.category})
            </span>
          )}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Example usage components demonstrating different access patterns
 */
export function MarketingTagExamples() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">Your Marketing Tags</h2>
        <UserMarketingTagsBadges />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Premium Content Example */}
        <TagBasedAccess
          requiredTags={["premium-member"]}
          title="Premium Content"
          description="This content is available to premium members only."
        >
          <Card className="border-golden bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-golden flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Premium Feature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                🎉 Welcome to our premium content! You have access to exclusive
                features.
              </p>
            </CardContent>
          </Card>
        </TagBasedAccess>

        {/* Beta Features Example */}
        <TagBasedAccess
          requiredTags={["beta-tester"]}
          title="Beta Features"
          description="These features are available to beta testers."
        >
          <Card className="border-blue-500 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Star className="h-5 w-5" />
                Beta Feature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                🚀 You're testing our newest features! Thanks for being a beta
                tester.
              </p>
            </CardContent>
          </Card>
        </TagBasedAccess>

        {/* Multiple Tags Required Example */}
        <TagBasedAccess
          requiredTags={["premium-member", "beta-tester"]}
          requireAll={true}
          title="Super Exclusive Content"
          description="You need both premium membership AND beta tester access."
        >
          <Card className="border-purple-500 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-600">Super Exclusive</CardTitle>
            </CardHeader>
            <CardContent>
              <p>🌟 You're part of our most exclusive group!</p>
            </CardContent>
          </Card>
        </TagBasedAccess>

        {/* Any of Multiple Tags Example */}
        <TagBasedAccess
          requiredTags={["premium-member", "vip-customer", "early-adopter"]}
          requireAll={false}
          title="Special Access Content"
          description="Available to premium members, VIP customers, or early adopters."
        >
          <Card className="border-green-500 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-600">Special Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p>💚 You have special access to this content!</p>
            </CardContent>
          </Card>
        </TagBasedAccess>
      </div>
    </div>
  );
}
