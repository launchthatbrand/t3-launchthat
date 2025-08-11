/**
 * Format user for display
 */
export function formatUser(user) {
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
export function getUserFullName(user) {
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.username || user.email || "Unnamed User";
}
/**
 * Get user's display name for mentions
 */
export function getUserDisplayName(user) {
    return user.username || user.name || `user-${user._id}`;
}
/**
 * Check if user is active
 */
export function isUserActive(user) {
    return user.status !== "suspended" && user.status !== "deleted";
}
/**
 * Check if user is admin
 */
export function isUserAdmin(user) {
    return user.role === "admin";
}
/**
 * Check if user has a valid subscription
 */
export function hasValidSubscription(user) {
    return (user.subscriptionStatus === "active" ||
        user.subscriptionStatus === "trialing");
}
/**
 * Check if user's trial has expired
 */
export function isTrialExpired(user) {
    if (!user.trialEndsAt)
        return false;
    return Date.now() > user.trialEndsAt;
}
/**
 * Get user's subscription status display text
 */
export function getSubscriptionStatusText(user) {
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
export function formatAddress(address) {
    if (!address)
        return "";
    const parts = [
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.stateOrProvince,
        address.postalCode,
        address.country,
    ].filter(Boolean);
    return parts.join(", ");
}
/**
 * Re-export from the central permissions module for better consistency
 */
export { requireAdmin } from "../lib/permissions/requirePermission";
