import { ConvexError } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { getAuthenticatedUserId } from "../../shared/auth";

/**
 * Get the authenticated user's Convex ID or throw an error
 * @param ctx - The Convex context
 * @returns The user's Convex ID
 */
export const getAuthenticatedConvexId = async (
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> => {
  // Get the authenticated user's Clerk ID
  const clerkId = await getAuthenticatedUserId(ctx);

  // Find the corresponding Convex user record
  const user = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("tokenIdentifier"), `clerk:${clerkId}`))
    .unique();

  if (!user) {
    throw new ConvexError({
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  return user._id;
};

/**
 * Check if a user has access to a calendar
 * @param ctx - The Convex context
 * @param calendarId - The calendar ID to check
 * @param userId - The user's Convex ID
 * @returns True if the user has access to the calendar
 */
export const hasCalendarAccess = async (
  ctx: QueryCtx | MutationCtx,
  calendarId: Id<"calendars">,
  userId: Id<"users">,
): Promise<boolean> => {
  // Get the calendar
  const calendar = await ctx.db.get(calendarId);
  if (!calendar) {
    return false;
  }

  // Check if the user is the owner
  if (calendar.ownerId === userId) {
    return true;
  }

  // Check if the calendar is public
  if (calendar.isPublic) {
    return true;
  }

  // Check if the user has explicit permission
  const permission = await ctx.db
    .query("calendarPermissions")
    .withIndex("by_calendar_user", (q) =>
      q.eq("calendarId", calendarId).eq("userId", userId),
    )
    .unique();

  return !!permission;
};

/**
 * Check if a user has write permission to a calendar
 * @param ctx - The Convex context
 * @param calendarId - The calendar ID to check
 * @param userId - The user's Convex ID
 * @returns True if the user has write permission to the calendar
 */
export const hasCalendarWriteAccess = async (
  ctx: QueryCtx | MutationCtx,
  calendarId: Id<"calendars">,
  userId: Id<"users">,
): Promise<boolean> => {
  // Get the calendar
  const calendar = await ctx.db.get(calendarId);
  if (!calendar) {
    return false;
  }

  // Check if the user is the owner
  if (calendar.ownerId === userId) {
    return true;
  }

  // Check if the user has explicit write permission
  const permission = await ctx.db
    .query("calendarPermissions")
    .withIndex("by_calendar_user", (q) =>
      q.eq("calendarId", calendarId).eq("userId", userId),
    )
    .unique();

  return (
    permission?.permissionType === "write" ||
    permission?.permissionType === "admin"
  );
};

/**
 * Check if a user has admin permission to a calendar
 * @param ctx - The Convex context
 * @param calendarId - The calendar ID to check
 * @param userId - The user's Convex ID
 * @returns True if the user has admin permission to the calendar
 */
export const hasCalendarAdminAccess = async (
  ctx: QueryCtx | MutationCtx,
  calendarId: Id<"calendars">,
  userId: Id<"users">,
): Promise<boolean> => {
  // Get the calendar
  const calendar = await ctx.db.get(calendarId);
  if (!calendar) {
    return false;
  }

  // Check if the user is the owner
  if (calendar.ownerId === userId) {
    return true;
  }

  // Check if the user has explicit admin permission
  const permission = await ctx.db
    .query("calendarPermissions")
    .withIndex("by_calendar_user", (q) =>
      q.eq("calendarId", calendarId).eq("userId", userId),
    )
    .unique();

  return permission?.permissionType === "admin";
};

/**
 * Verify calendar access or throw an error
 * @param ctx - The Convex context
 * @param calendarId - The calendar ID to check
 * @param userId - The user's Convex ID
 * @throws ConvexError if the user doesn't have access to the calendar
 */
export const verifyCalendarAccess = async (
  ctx: QueryCtx | MutationCtx,
  calendarId: Id<"calendars">,
  userId: Id<"users">,
): Promise<void> => {
  const hasAccess = await hasCalendarAccess(ctx, calendarId, userId);
  if (!hasAccess) {
    throw new ConvexError({
      message: "You don't have access to this calendar",
      code: "CALENDAR_ACCESS_DENIED",
    });
  }
};

/**
 * Verify calendar write access or throw an error
 * @param ctx - The Convex context
 * @param calendarId - The calendar ID to check
 * @param userId - The user's Convex ID
 * @throws ConvexError if the user doesn't have write access to the calendar
 */
export const verifyCalendarWriteAccess = async (
  ctx: QueryCtx | MutationCtx,
  calendarId: Id<"calendars">,
  userId: Id<"users">,
): Promise<void> => {
  const hasAccess = await hasCalendarWriteAccess(ctx, calendarId, userId);
  if (!hasAccess) {
    throw new ConvexError({
      message: "You don't have write access to this calendar",
      code: "CALENDAR_WRITE_ACCESS_DENIED",
    });
  }
};

/**
 * Verify calendar admin access or throw an error
 * @param ctx - The Convex context
 * @param calendarId - The calendar ID to check
 * @param userId - The user's Convex ID
 * @throws ConvexError if the user doesn't have admin access to the calendar
 */
export const verifyCalendarAdminAccess = async (
  ctx: QueryCtx | MutationCtx,
  calendarId: Id<"calendars">,
  userId: Id<"users">,
): Promise<void> => {
  const hasAccess = await hasCalendarAdminAccess(ctx, calendarId, userId);
  if (!hasAccess) {
    throw new ConvexError({
      message: "You don't have admin access to this calendar",
      code: "CALENDAR_ADMIN_ACCESS_DENIED",
    });
  }
};
