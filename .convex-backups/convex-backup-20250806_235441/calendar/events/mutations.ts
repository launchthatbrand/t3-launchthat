import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { generateUniqueSlug, sanitizeSlug } from "../../lib/slugs";

/**
 * Create a new calendar event with automatic slug generation
 */
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    allDay: v.boolean(),
    timezone: v.optional(v.string()),
    type: v.union(
      v.literal("meeting"),
      v.literal("webinar"),
      v.literal("workshop"),
      v.literal("class"),
      v.literal("conference"),
      v.literal("social"),
      v.literal("deadline"),
      v.literal("reminder"),
      v.literal("other"),
    ),
    color: v.optional(v.string()),
    location: v.optional(
      v.object({
        type: v.union(
          v.literal("virtual"),
          v.literal("physical"),
          v.literal("hybrid"),
        ),
        address: v.optional(v.string()),
        url: v.optional(v.string()),
        meetingId: v.optional(v.string()),
        passcode: v.optional(v.string()),
      }),
    ),
    visibility: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("restricted"),
    ),
    groupId: v.optional(v.id("groups")),
    courseId: v.optional(v.id("courses")),
    calendarIds: v.array(v.id("calendars")),
    customSlug: v.optional(v.string()),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    const { title, customSlug, calendarIds, ...otherArgs } = args;
    const timestamp = Date.now();

    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to createEvent");
    }

    // Find the user in the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate a unique slug from the title or use a custom slug if provided
    // This will add a suffix if needed for uniqueness
    let slug;
    if (customSlug) {
      // Sanitize the custom slug if provided
      const sanitizedSlug = sanitizeSlug(customSlug);
      slug = await generateUniqueSlug(ctx.db, "events", sanitizedSlug);
    } else {
      // Generate a slug from the event title
      slug = await generateUniqueSlug(ctx.db, "events", title);
    }

    // Create the event
    const eventId = await ctx.db.insert("events", {
      title,
      slug, // Add the slug field to the events table
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...otherArgs,
    });

    // Associate the event with the provided calendars
    for (const calendarId of calendarIds) {
      await ctx.db.insert("calendarEvents", {
        calendarId,
        eventId,
        isPrimary: calendarIds.indexOf(calendarId) === 0, // First calendar is primary
      });
    }

    return eventId;
  },
});
