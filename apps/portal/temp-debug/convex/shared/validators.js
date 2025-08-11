import { v } from "convex/values";
/**
 * Common validator patterns used across the application
 * This file centralizes validator definitions to ensure consistency
 */
// User-related validators
export const userIdValidator = v.id("users");
// Timestamp validators
export const timestampValidator = v.number();
// Common status validators
export const statusValidator = v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"), v.literal("archived"));
// Visibility validator
export const visibilityValidator = v.union(v.literal("public"), v.literal("private"), v.literal("restricted"));
// Common notification types validator
export const notificationTypeValidator = v.union(
// User-to-user interactions
v.literal("friendRequest"), v.literal("friendAccepted"), v.literal("message"), v.literal("mention"), 
// Group-related notifications
v.literal("groupInvite"), v.literal("groupJoinRequest"), v.literal("groupJoinApproved"), v.literal("groupJoinRejected"), v.literal("groupInvitation"), v.literal("invitationAccepted"), v.literal("invitationDeclined"), v.literal("groupPost"), v.literal("groupComment"), 
// Event-related notifications
v.literal("eventInvite"), v.literal("eventReminder"), v.literal("eventUpdate"), 
// Content-related notifications
v.literal("newDownload"), v.literal("courseUpdate"), 
// E-commerce related notifications
v.literal("orderConfirmation"), v.literal("paymentSuccess"), v.literal("paymentFailed"), v.literal("productUpdate"), 
// System notifications
v.literal("systemAnnouncement"), 
// Social feed notifications
v.literal("reaction"), v.literal("comment"), v.literal("commentReply"), v.literal("share"), v.literal("newFollowedUserPost"));
// Calendar event type validator
export const eventTypeValidator = v.union(v.literal("meeting"), v.literal("webinar"), v.literal("workshop"), v.literal("class"), v.literal("conference"), v.literal("social"), v.literal("deadline"), v.literal("reminder"), v.literal("other"));
// Location type validator
export const locationTypeValidator = v.union(v.literal("virtual"), v.literal("physical"), v.literal("hybrid"));
// Location validator
export const locationValidator = v.object({
    type: locationTypeValidator,
    address: v.optional(v.string()),
    url: v.optional(v.string()),
    meetingId: v.optional(v.string()),
    passcode: v.optional(v.string()),
});
// Weekday validator
export const weekdayValidator = v.union(v.literal("MO"), v.literal("TU"), v.literal("WE"), v.literal("TH"), v.literal("FR"), v.literal("SA"), v.literal("SU"));
// Recurrence frequency validator
export const recurrenceFrequencyValidator = v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"));
// Recurrence validator
export const recurrenceValidator = v.object({
    frequency: recurrenceFrequencyValidator,
    interval: v.optional(v.number()),
    count: v.optional(v.number()),
    until: v.optional(v.number()),
    byDay: v.optional(v.array(weekdayValidator)),
    byMonthDay: v.optional(v.array(v.number())),
    byMonth: v.optional(v.array(v.number())),
    excludeDates: v.optional(v.array(v.number())),
});
// Pagination options validator
export const paginationOptsValidator = v.object({
    numItems: v.number(),
    cursor: v.union(v.string(), v.null()),
});
// Generic ID validator factory
export const idValidator = (tableName) => v.id(tableName);
// Generic response validator for API responses
export const apiResponseValidator = (dataValidator) => v.object({
    success: v.boolean(),
    message: v.optional(v.string()),
    data: v.optional(dataValidator),
});
