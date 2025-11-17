import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { useConvexUser } from "./useConvexUser";

export function useMarketingTags() {
  // Get all marketing tags
  const marketingTags = useQuery(
    api.core.users.marketingTags.index.listMarketingTags,
    {},
  );

  // Mutations
  const createTag = useMutation(
    api.core.users.marketingTags.index.createMarketingTag,
  );
  const assignTag = useMutation(
    api.core.users.marketingTags.index.assignMarketingTagToUser,
  );
  const removeTag = useMutation(
    api.core.users.marketingTags.index.removeMarketingTagFromUser,
  );

  return {
    marketingTags,
    createTag,
    assignTag,
    removeTag,
  };
}

export function useUserMarketingTags(userId?: Id<"users">) {
  const { convexId } = useConvexUser();
  const targetUserId = userId || convexId;

  // Get user's marketing tags
  const userTags = useQuery(
    api.core.users.marketingTags.index.getUserMarketingTags,
    targetUserId ? { userId: targetUserId } : "skip",
  );

  // Mutations
  const assignTagMutation = useMutation(
    api.core.users.marketingTags.index.assignMarketingTagToUser,
  );
  const removeTagMutation = useMutation(
    api.core.users.marketingTags.index.removeMarketingTagFromUser,
  );

  const assignTag = async (args: {
    userId: Id<"users">;
    tagId: Id<"marketingTags">;
    source?: string;
    assignedBy?: Id<"users">;
    expiresAt?: number;
  }) => {
    return assignTagMutation({
      userId: args.userId,
      marketingTagId: args.tagId,
      source: args.source,
      expiresAt: args.expiresAt,
    });
  };

  const removeTag = async (args: {
    userId: Id<"users">;
    tagId: Id<"marketingTags">;
  }) => {
    return removeTagMutation({
      userId: args.userId,
      marketingTagId: args.tagId,
    });
  };

  return {
    userTags,
    assignTag,
    removeTag,
    isLoading: userTags === undefined,
  };
}

export function useMarketingTagAccess(tagSlugs: string[], requireAll = false) {
  const { convexId } = useConvexUser();

  // Check if current user has the required tags
  const access = useQuery(
    api.core.users.marketingTags.index.userHasMarketingTags,
    convexId && tagSlugs.length > 0
      ? {
          userId: convexId,
          tagSlugs,
          requireAll,
        }
      : "skip",
  );

  return {
    hasAccess: access?.hasAccess ?? false,
    matchingTags: access?.matchingTags ?? [],
    missingTags: access?.missingTags ?? [],
    isLoading: access === undefined,
  };
}
