/**
 * Helper functions for the downloads module
 */

import { ConvexError } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import {
  throwForbidden as _throwForbidden,
  throwUnauthorized,
} from "../../shared/errors";

/**
 * Get the currently authenticated user
 * Note: This function works only with QueryCtx and MutationCtx (not ActionCtx)
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throwUnauthorized();
  }

  console.log("User identity:", {
    tokenIdentifier: identity.tokenIdentifier,
    subject: identity.subject,
    issuer: identity.issuer,
  });

  // Use the tokenIdentifier field and by_token index which exists in the schema
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .first();

  if (!user) {
    console.error(
      "User not found for tokenIdentifier:",
      identity.tokenIdentifier,
    );
    throw new ConvexError({
      code: 401,
      message:
        "User not found. Please complete registration or refresh your session.",
    });
  }

  return user;
}

/**
 * Prepare searchable text for downloads
 */
export function prepareSearchText(
  title?: string,
  description?: string,
  fileName?: string,
  tags?: string[],
): string {
  const parts = [
    title ?? "",
    description ?? "",
    fileName ?? "",
    ...(tags ?? []),
  ].filter(Boolean);

  return parts.join(" ").toLowerCase();
}

/**
 * Check if user has access to a specific download
 */
export async function checkDownloadAccess(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  downloadId: Id<"downloads">,
): Promise<boolean> {
  const download = await ctx.db.get(downloadId);
  if (!download) {
    return false;
  }

  // User is the uploader
  if (download.uploadedBy === userId) {
    return true;
  }

  // Download is public
  if (download.isPublic) {
    return true;
  }

  // User is in the access list
  if (
    Array.isArray(download.accessibleUserIds) &&
    download.accessibleUserIds.includes(userId)
  ) {
    return true;
  }

  // Check product access if required
  if (download.requiredProductId) {
    // For now, we'll just return false for these advanced access checks
    // to simplify the implementation and avoid schema typing issues
    // TODO: Implement proper product access checking when schema is updated
    return false;
  }

  // Check course access if required
  if (download.requiredCourseId) {
    // For now, we'll just return false for these advanced access checks
    // to simplify the implementation and avoid schema typing issues
    // TODO: Implement proper course access checking when schema is updated
    return false;
  }

  return false;
}

/**
 * Check if a user is an admin
 */
export async function isAdmin(
  ctx: MutationCtx | QueryCtx,
  userId: Id<"users">,
): Promise<boolean> {
  if (!userId) return false;

  const user = await ctx.db.get(userId);
  return user?.role === "admin";
}

/**
 * Get downloads associated with a specific group
 */
export async function getGroupDownloads(
  ctx: QueryCtx,
  groupId: Id<"groups">,
  limit: number = 5,
) {
  // Get downloads for the specified group, ordered by creation time
  const downloads = await ctx.db
    .query("downloads")
    .withIndex("by_group", (q) => q.eq("groupId", groupId))
    .order("desc")
    .take(limit);

  // Enhance with uploader information
  const result = [];
  for (const download of downloads) {
    let uploader = null;
    if (download.uploadedBy) {
      const user = await ctx.db.get(download.uploadedBy);
      if (user) {
        uploader = {
          name: user.name,
          image: user.image,
        };
      }
    }

    result.push({
      ...download,
      uploader,
    });
  }

  return result;
}
