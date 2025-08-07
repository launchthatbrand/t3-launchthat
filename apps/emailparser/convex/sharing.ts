import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import {
  ACTIONS,
  hasPermission,
  isAdmin,
  logAuditEvent,
  RESOURCE_TYPES,
} from "./permissions";

// Validator for resource types that can be shared
const resourceTypeValidator = v.union(
  v.literal(RESOURCE_TYPES.EMAIL),
  v.literal(RESOURCE_TYPES.TEMPLATE),
);

// Validator for permission types that can be granted
const permissionValidator = v.union(
  v.literal(ACTIONS.READ),
  v.literal(ACTIONS.UPDATE),
  v.literal(ACTIONS.DELETE),
  v.literal(ACTIONS.SHARE),
);

interface ResourceWithUserId {
  userId: string;
  [key: string]: any;
}

// Helper function to validate resource ownership
const validateResourceOwnership = async (
  ctx: QueryCtx | MutationCtx,
  resourceType: string,
  resourceId: Id<any>,
): Promise<string> => {
  const userId = await requireUser(ctx);

  let resource: ResourceWithUserId | null = null;
  if (resourceType === RESOURCE_TYPES.EMAIL) {
    resource = (await ctx.db.get(
      resourceId as Id<"emails">,
    )) as ResourceWithUserId | null;
  } else if (resourceType === RESOURCE_TYPES.TEMPLATE) {
    resource = (await ctx.db.get(
      resourceId as Id<"templates">,
    )) as ResourceWithUserId | null;
  } else {
    throw new ConvexError(`Invalid resource type: ${resourceType}`);
  }

  if (!resource) {
    throw new ConvexError(`Resource not found`);
  }

  // Check if user is owner or admin
  const isOwner = resource.userId === userId;

  if (!isOwner && !(await isAdmin(ctx))) {
    throw new ConvexError("Only the owner or an admin can share this resource");
  }

  return userId;
};

// Share a resource with another user
export const shareResource = mutation({
  args: {
    resourceType: resourceTypeValidator,
    resourceId: v.union(v.id("emails"), v.id("templates")),
    sharedWithUserId: v.string(),
    permissions: v.array(permissionValidator),
  },
  returns: v.id("sharedResources"),
  handler: async (ctx, args) => {
    try {
      const { resourceType, resourceId, sharedWithUserId, permissions } = args;

      // Validate ownership
      const userId = await validateResourceOwnership(
        ctx,
        resourceType,
        resourceId,
      );

      // Don't allow sharing with self
      if (userId === sharedWithUserId) {
        throw new ConvexError("Cannot share a resource with yourself");
      }

      // Check if this resource is already shared with this user
      const existingShare = await ctx.db
        .query("sharedResources")
        .withIndex("by_resourceType_resourceId_sharedWithUserId", (q) =>
          q
            .eq("resourceType", resourceType)
            .eq("resourceId", resourceId)
            .eq("sharedWithUserId", sharedWithUserId),
        )
        .first();

      // If already shared, update permissions
      if (existingShare) {
        await ctx.db.patch(existingShare._id, {
          permissions,
        });

        // Log the action
        await logAuditEvent(
          ctx,
          userId,
          "update_share",
          resourceType,
          resourceId,
          { sharedWithUserId, permissions },
        );

        return existingShare._id;
      }

      // Create new share
      const sharedResourceId = await ctx.db.insert("sharedResources", {
        resourceType,
        resourceId,
        userId,
        sharedWithUserId,
        sharedAt: Date.now(),
        permissions,
      });

      // Log the action
      await logAuditEvent(ctx, userId, "share", resourceType, resourceId, {
        sharedWithUserId,
        permissions,
      });

      return sharedResourceId;
    } catch (error) {
      console.error("Error sharing resource:", error);
      throw error;
    }
  },
});

// Remove shared access to a resource
export const removeSharedAccess = mutation({
  args: {
    resourceType: resourceTypeValidator,
    resourceId: v.union(v.id("emails"), v.id("templates")),
    sharedWithUserId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const { resourceType, resourceId, sharedWithUserId } = args;

      // Validate ownership
      const userId = await validateResourceOwnership(
        ctx,
        resourceType,
        resourceId,
      );

      // Find the shared resource record
      const sharedResource = await ctx.db
        .query("sharedResources")
        .withIndex("by_resourceType_resourceId_sharedWithUserId", (q) =>
          q
            .eq("resourceType", resourceType)
            .eq("resourceId", resourceId)
            .eq("sharedWithUserId", sharedWithUserId),
        )
        .first();

      if (!sharedResource) {
        throw new ConvexError("Resource is not shared with this user");
      }

      // Delete the shared resource record
      await ctx.db.delete(sharedResource._id);

      // Log the action
      await logAuditEvent(
        ctx,
        userId,
        "remove_share",
        resourceType,
        resourceId,
        { sharedWithUserId },
      );

      return true;
    } catch (error) {
      console.error("Error removing shared access:", error);
      throw error;
    }
  },
});

// Get all resources shared with a user
export const getSharedWithMe = query({
  args: {
    resourceType: v.optional(resourceTypeValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id("sharedResources"),
      resourceType: v.string(),
      resourceId: v.union(v.id("emails"), v.id("templates")),
      userId: v.string(), // Owner
      sharedAt: v.number(),
      permissions: v.array(v.string()),
      resourceDetails: v.any(), // Details about the resource
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await requireUser(ctx);

      // Query based on resource type if provided
      let sharedResourcesQuery = ctx.db
        .query("sharedResources")
        .withIndex("by_sharedWithUserId", (q) =>
          q.eq("sharedWithUserId", userId),
        );

      if (args.resourceType) {
        sharedResourcesQuery = ctx.db
          .query("sharedResources")
          .withIndex("by_resourceType_resourceId_sharedWithUserId", (q) =>
            q
              .eq("resourceType", args.resourceType)
              .eq("sharedWithUserId", userId),
          );
      }

      const sharedResources = await sharedResourcesQuery.collect();

      // Get resource details for each shared resource
      const result = [];

      for (const resource of sharedResources) {
        let resourceDetails = null;

        if (resource.resourceType === RESOURCE_TYPES.EMAIL) {
          resourceDetails = await ctx.db.get(
            resource.resourceId as Id<"emails">,
          );
        } else if (resource.resourceType === RESOURCE_TYPES.TEMPLATE) {
          resourceDetails = await ctx.db.get(
            resource.resourceId as Id<"templates">,
          );
        }

        if (resourceDetails) {
          result.push({
            ...resource,
            resourceDetails,
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting shared resources:", error);
      throw error;
    }
  },
});

// Get all users a resource is shared with
export const getResourceSharing = query({
  args: {
    resourceType: resourceTypeValidator,
    resourceId: v.union(v.id("emails"), v.id("templates")),
  },
  returns: v.array(
    v.object({
      _id: v.id("sharedResources"),
      sharedWithUserId: v.string(),
      sharedAt: v.number(),
      permissions: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const { resourceType, resourceId } = args;
      const userId = await requireUser(ctx);

      // Validate access
      let resource: ResourceWithUserId | null = null;
      if (resourceType === RESOURCE_TYPES.EMAIL) {
        resource = (await ctx.db.get(
          resourceId as Id<"emails">,
        )) as ResourceWithUserId | null;
      } else if (resourceType === RESOURCE_TYPES.TEMPLATE) {
        resource = (await ctx.db.get(
          resourceId as Id<"templates">,
        )) as ResourceWithUserId | null;
      }

      if (!resource) {
        throw new ConvexError("Resource not found");
      }

      // Check if user is owner, admin, or has permission to view sharing info
      const isOwner = resource.userId === userId;

      if (
        !isOwner &&
        !(await isAdmin(ctx)) &&
        !(await hasPermission(ctx, resourceType, ACTIONS.SHARE, resourceId))
      ) {
        throw new ConvexError(
          "You don't have permission to view sharing information",
        );
      }

      // Get all users this resource is shared with
      const shares = await ctx.db
        .query("sharedResources")
        .withIndex("by_resourceType_resourceId", (q) =>
          q.eq("resourceType", resourceType).eq("resourceId", resourceId),
        )
        .collect();

      return shares.map((share) => ({
        _id: share._id,
        sharedWithUserId: share.sharedWithUserId,
        sharedAt: share.sharedAt,
        permissions: share.permissions,
      }));
    } catch (error) {
      console.error("Error getting resource sharing:", error);
      throw error;
    }
  },
});
