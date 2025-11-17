/**
 * Users Helpers
 *
 * Shared utility functions for the users feature.
 */
import type { Doc } from "../../_generated/dataModel";

/**
 * Format user for display
 */
export function formatUser(user: Doc<"users">): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.name) {
    return user.name;
  }
  if (user.username) {
    return `@${user.username}`;
  }
  if (user.email) {
    return user.email;
  }
  return "Unnamed User";
}

/**
 * Get user's full name
 */
export function getUserFullName(user: Doc<"users">): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return (user.name ?? user.username ?? user.email) || "Unnamed User";
}

/**
 * Get user's display name for mentions
 */
export function getUserDisplayName(user: Doc<"users">): string {
  return user.username ?? user.name ?? `user-${user._id}`;
}

/**
 * Check if user is active
 */
export function isUserActive(user: Doc<"users">): boolean {
  return user.status !== "suspended" && user.status !== "deleted";
}

/**
 * Check if user is admin
 */
export function isUserAdmin(user: Doc<"users">): boolean {
  return user.role === "admin";
}

/**
 * Check if user has a valid subscription
 */
export function hasValidSubscription(user: Doc<"users">): boolean {
  return (
    user.subscriptionStatus === "active" ||
    user.subscriptionStatus === "trialing"
  );
}

/**
 * Check if user's trial has expired
 */
export function isTrialExpired(user: Doc<"users">): boolean {
  if (!user.trialEndsAt) return false;
  return Date.now() > user.trialEndsAt;
}

/**
 * Get user's subscription status display text
 */
export function getSubscriptionStatusText(user: Doc<"users">): string {
  switch (user.subscriptionStatus) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "canceled":
      return "Canceled";
    case "past_due":
      return "Past Due";
    case "incomplete":
      return "Incomplete";
    case "incomplete_expired":
      return "Expired";
    case "unpaid":
      return "Unpaid";
    default:
      return "Unknown";
  }
}

/**
 * Format user's address for display
 */
export function formatAddress(address: Doc<"users">["addresses"]): string {
  if (!address) return "";

  const parts = [
    address[0]?.addressLine1,
    address[0]?.addressLine2,
    address[0]?.city,
    address[0]?.stateOrProvince,
    address[0]?.postalCode,
    address[0]?.country,
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Re-export from the central permissions module for better consistency
 */
export { requireAdmin } from "../../lib/permissions/requirePermission";
