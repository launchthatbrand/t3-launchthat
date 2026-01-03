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
    api.core.crm.marketingTags.index.listCrmMarketingTags,
    organizationId ? ({ organizationId } as any) : "skip",
  );

  // Mutations
  const createTagMutation = useMutation(
    api.core.crm.marketingTags.index.createCrmMarketingTag,
  );
  const assignTagToContactMutation = useMutation(
    api.core.crm.marketingTags.index.assignMarketingTagToContact,
  );
  const removeTagFromContactMutation = useMutation(
    api.core.crm.marketingTags.index.removeMarketingTagFromContact,
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
    assignTagToContact: assignTagToContactMutation,
    removeTagFromContact: removeTagFromContactMutation,
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
    api.core.crm.identity.queries.getContactIdForUser,
    targetUserId && organizationId
      ? ({ organizationId, userId: targetUserId } as any)
      : "skip",
  );

  const userTags = useQuery(
    api.core.crm.marketingTags.index.getContactMarketingTags,
    contactId && organizationId
      ? ({ organizationId, contactId } as any)
      : "skip",
  );

  // Mutations
  const assignTagMutation = useMutation(
    api.core.crm.marketingTags.index.assignMarketingTagToContact,
  );
  const removeTagMutation = useMutation(
    api.core.crm.marketingTags.index.removeMarketingTagFromContact,
  );

  const assignTag = async (args: {
    userId: Id<"users">; // will be resolved to a contact
    tagId: Id<"crmMarketingTags">;
    source?: string;
    expiresAt?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      throw new Error("Missing organization");
    }
    if (!contactId) {
      throw new Error("No contact linked to this user");
    }
    return assignTagMutation({
      organizationId: organizationId as any,
      contactId: contactId as any,
      marketingTagId: args.tagId as any,
      source: args.source,
      expiresAt: args.expiresAt,
      notes: args.notes,
    });
  };

  const removeTag = async (args: {
    userId: Id<"users">;
    tagId: Id<"crmMarketingTags">;
  }) => {
    if (!organizationId) {
      throw new Error("Missing organization");
    }
    if (!contactId) {
      throw new Error("No contact linked to this user");
    }
    return removeTagMutation({
      organizationId: organizationId as any,
      contactId: contactId as any,
      marketingTagId: args.tagId as any,
    });
  };

  return {
    userTags,
    assignTag,
    removeTag,
    isLoading: userTags === undefined,
    contactId: contactId ?? null,
  };
}

export function useMarketingTagAccess(tagSlugs: string[], requireAll = false) {
  const { convexId } = useConvexUser();
  const tenant = useTenant();
  const organizationId =
    tenant?.slug === PORTAL_TENANT_SLUG ? PORTAL_TENANT_SLUG : tenant?._id ?? null;

  const contactId = useQuery(
    api.core.crm.identity.queries.getContactIdForUser,
    convexId && organizationId ? ({ organizationId, userId: convexId } as any) : "skip",
  );

  const access = useQuery(
    api.core.crm.marketingTags.index.contactHasMarketingTags,
    contactId && organizationId && tagSlugs.length > 0
      ? {
          organizationId: organizationId as any,
          contactId: contactId as any,
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
