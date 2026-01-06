import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { useTenant } from "~/context/TenantContext";
import { PORTAL_TENANT_SLUG } from "~/lib/tenant-fetcher";
import { useConvexUser } from "./useConvexUser";

export function useMarketingTags() {
  const tenant = useTenant();
  const organizationId =
    tenant?.slug === PORTAL_TENANT_SLUG ? PORTAL_TENANT_SLUG : tenant?._id ?? null;

  const marketingTags = useQuery(
    api.plugins.crm.marketingTags.queries.listMarketingTags,
    organizationId ? ({ organizationId } as any) : "skip",
  );

  // Mutations
  const createTagMutation = useMutation(
    api.plugins.crm.marketingTags.mutations.createMarketingTag,
  );

  const createTag = async (args: {
    name: string;
    description?: string;
    category?: string;
    color?: string;
    slug?: string;
    isActive?: boolean;
  }) => {
    if (!organizationId) {
      throw new Error("Missing organization");
    }
    return await createTagMutation({ organizationId: organizationId as any, ...args });
  };

  return {
    marketingTags,
    createTag,
    organizationId,
  };
}

export function useUserMarketingTags(userId?: Id<"users">) {
  const { convexId } = useConvexUser();
  const targetUserId = userId || convexId;
  const tenant = useTenant();
  const organizationId =
    tenant?.slug === PORTAL_TENANT_SLUG ? PORTAL_TENANT_SLUG : tenant?._id ?? null;

  const contactId = useQuery(
    api.plugins.crm.marketingTags.queries.getContactIdForUser,
    targetUserId && organizationId
      ? ({ organizationId, userId: String(targetUserId) } as any)
      : "skip",
  ) as unknown as string | null | undefined;

  const userTags = useQuery(
    api.plugins.crm.marketingTags.queries.getUserMarketingTags,
    targetUserId && organizationId
      ? ({ organizationId, userId: String(targetUserId) } as any)
      : "skip",
  );

  // Mutations
  const assignTagMutation = useMutation(
    api.plugins.crm.marketingTags.mutations.assignMarketingTagToUser,
  );
  const removeTagMutation = useMutation(
    api.plugins.crm.marketingTags.mutations.removeMarketingTagFromUser,
  );

  const assignTag = async (args: {
    userId: Id<"users">; // will be resolved to a contact
    tagId: string;
    source?: string;
    expiresAt?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      throw new Error("Missing organization");
    }
    return assignTagMutation({
      organizationId: organizationId as any,
      marketingTagId: args.tagId as any,
      userId: String(args.userId),
      source: args.source,
      expiresAt: args.expiresAt,
      notes: args.notes,
    });
  };

  const removeTag = async (args: {
    userId: Id<"users">;
    tagId: string;
  }) => {
    if (!organizationId) {
      throw new Error("Missing organization");
    }
    return removeTagMutation({
      organizationId: organizationId as any,
      marketingTagId: args.tagId as any,
      userId: String(args.userId),
    });
  };

  return {
    userTags,
    assignTag,
    removeTag,
    isLoading: userTags === undefined,
    contactId: typeof contactId === "string" ? contactId : null,
  };
}

export function useMarketingTagAccess(tagSlugs: string[], requireAll = false) {
  const { convexId } = useConvexUser();
  const tenant = useTenant();
  const organizationId =
    tenant?.slug === PORTAL_TENANT_SLUG ? PORTAL_TENANT_SLUG : tenant?._id ?? null;

  const contactId = useQuery(
    api.plugins.crm.marketingTags.queries.getContactIdForUser,
    convexId && organizationId ? ({ organizationId, userId: String(convexId) } as any) : "skip",
  ) as unknown as string | null | undefined;

  const access = useQuery(
    api.plugins.crm.marketingTags.queries.contactHasMarketingTags,
    contactId && organizationId && tagSlugs.length > 0
      ? {
          organizationId: organizationId as any,
          contactId: contactId as any,
          tagSlugs,
          requireAll,
        }
      : "skip",
  ) as any;

  return {
    hasAccess: access?.hasAccess ?? false,
    matchingTags: access?.matchingTags ?? [],
    missingTags: access?.missingTags ?? [],
    isLoading: access === undefined,
  };
}
