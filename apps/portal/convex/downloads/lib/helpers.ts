/**
 * Helper functions for the downloads module
 */

import { ConvexError } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { throwForbidden, throwUnauthorized } from "../../shared/errors";

/**
 * Get the currently authenticated user
 * Note: This function works only with QueryCtx and MutationCtx (not ActionCtx)
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throwUnauthorized();
  }

  // TypeScript doesn't recognize that clerkId is a valid index field
  // In a real app, we would update the schema definition to properly type this
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new ConvexError({
      code: 401,
      message: "User not found. Please complete registration.",
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
    title || "",
    description || "",
    fileName || "",
    ...(tags || []),
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
    // TypeScript doesn't recognize these tables/indexes
    // In a real app, we would update the schema definition to properly type these
    // Using 'any' type casting for now to bypass TypeScript errors
    const userProduct = await (ctx.db as any)
      .query("userProducts")
      .withIndex("by_user_product", (q: any) =>
        q.eq("userId", userId).eq("productId", download.requiredProductId),
      )
      .first();

    if (userProduct) {
      return true;
    }
  }

  // Check course access if required
  if (download.requiredCourseId) {
    // TypeScript doesn't recognize these tables/indexes
    // In a real app, we would update the schema definition to properly type these
    // Using 'any' type casting for now to bypass TypeScript errors
    const enrollment = await (ctx.db as any)
      .query("enrollments")
      .withIndex("by_user_course", (q: any) =>
        q.eq("userId", userId).eq("courseId", download.requiredCourseId),
      )
      .first();

    if (enrollment) {
      return true;
    }
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
