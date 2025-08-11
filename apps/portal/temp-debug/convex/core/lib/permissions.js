// import { v } from "convex/values"; // REMOVED - unused
// import { permissionScopeTypeValidator } from "../schema/permissionsSchema"; // REMOVED - unused
// Adjusted path
// =======================================================
// Define permission constants
// =======================================================
// User permissions
export const USER_PERMISSIONS = {
    CREATE: "user:create",
    READ: "user:read",
    UPDATE: "user:update",
    DELETE: "user:delete",
    MANAGE: "user:manage",
}; // Added as const
// ... (all other PERMISSION constants should also have 'as const')
export const GROUP_PERMISSIONS = {
    CREATE: "group:create",
    READ: "group:read",
    UPDATE: "group:update",
    DELETE: "group:delete",
    MANAGE: "group:manage",
    JOIN: "group:join",
    INVITE: "group:invite",
};
export const CONTENT_PERMISSIONS = {
    CREATE: "content:create",
    READ: "content:read",
    UPDATE: "content:update",
    DELETE: "content:delete",
    PUBLISH: "content:publish",
    APPROVE: "content:approve",
};
export const CALENDAR_PERMISSIONS = {
    CREATE: "calendar:create",
    READ: "calendar:read",
    UPDATE: "calendar:update",
    DELETE: "calendar:delete",
    SHARE: "calendar:share",
};
export const EVENT_PERMISSIONS = {
    CREATE: "event:create",
    READ: "event:read",
    UPDATE: "event:update",
    DELETE: "event:delete",
    INVITE: "event:invite",
    MANAGE_ATTENDEES: "event:manage_attendees",
};
export const COURSE_PERMISSIONS = {
    CREATE: "course:create",
    READ: "course:read",
    UPDATE: "course:update",
    DELETE: "course:delete",
    ENROLL: "course:enroll",
    GRADE: "course:grade",
};
export const PRODUCT_PERMISSIONS = {
    CREATE: "product:create",
    READ: "product:read",
    UPDATE: "product:update",
    DELETE: "product:delete",
    MANAGE_INVENTORY: "product:manage_inventory",
    MANAGE_PRICING: "product:manage_pricing",
};
export const ORDER_PERMISSIONS = {
    CREATE: "order:create",
    READ: "order:read",
    UPDATE: "order:update",
    DELETE: "order:delete",
    PROCESS: "order:process",
    REFUND: "order:refund",
};
export const ADMIN_PERMISSIONS = {
    ACCESS_ADMIN_PANEL: "admin:access_panel",
    MANAGE_ROLES: "admin:manage_roles",
    MANAGE_PERMISSIONS: "admin:manage_permissions",
    SYSTEM_SETTINGS: "admin:system_settings",
    VIEW_LOGS: "admin:view_logs",
};
// =======================================================
// Helper functions for permission checking
// =======================================================
/**
 * Get the authenticated user's ID from their tokenIdentifier, or throw an error if not authenticated/found.
 */
export const getAuthenticatedUserDocIdByToken = async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated: No user identity found.");
    }
    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique(); // Changed from .first() to .unique() as tokenIdentifier should be unique
    if (!user) {
        throw new Error("User not found for the given token identifier.");
    }
    return user._id;
};
/**
 * Retrieves the authenticated user's identity object.
 * Returns null if the user is not authenticated.
 */
export async function getOptionalAuthenticatedUserIdentity(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    return identity;
}
/**
 * Retrieves the authenticated user's ID (subject) from the context.
 * Returns null if the user is not authenticated.
 */
export async function getOptionalAuthenticatedUserId(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject;
    return subject ? subject : null;
}
const levelsOrder = ["none", "own", "group", "all"];
/**
 * Check if a user has a specific permission
 */
export const hasPermission = async (ctx, userId, permissionKey, scopeType = "global", scopeId, resourceOwnerId) => {
    const userRoles = await ctx.db
        .query("userRoleAssignments")
        .withIndex("by_user_scope", (q) => q
        .eq("userId", userId)
        .eq("scopeType", scopeType)
        .eq("scopeId", scopeId ?? null))
        .collect();
    // If checking a specific scope, also consider global roles
    if (scopeType !== "global") {
        const globalRoles = await ctx.db
            .query("userRoleAssignments")
            .withIndex("by_user_scope", (q) => q
            .eq("userId", userId)
            .eq("scopeType", "global")
            .eq("scopeId", null))
            .collect();
        userRoles.push(...globalRoles);
    }
    if (userRoles.length === 0) {
        // No roles found for this scope, check for direct permissions
        const directPermission = await ctx.db
            .query("userPermissions") // Assuming "userPermissions" is the table for direct user-permission links
            .withIndex("by_user_permission", (q) => q.eq("userId", userId).eq("permissionKey", permissionKey))
            .first(); // A user should only have one direct entry per permission key ideally
        if (!directPermission)
            return false;
        // Validate scope of direct permission
        if (directPermission.scopeType !== scopeType ||
            (scopeId && directPermission.scopeId !== scopeId) // Check scopeId if provided
        )
            return false;
        if (directPermission.level === "none")
            return false;
        if (directPermission.level === "own" && resourceOwnerId !== userId)
            return false;
        return true;
    }
    const roleIds = userRoles.map((link) => link.roleId);
    let highestLevel = "none";
    for (const roleId of roleIds) {
        const role = await ctx.db.get(roleId);
        if (!role)
            continue;
        // Ensure role has a 'name' property, which is typical for roles tables.
        // If your rolesTable in permissionsSchema.ts doesn't have 'name', this check might need adjustment.
        if (!("name" in role)) {
            console.warn(`Role with ID ${roleId} does not have a name property. Skipping for permission check.`);
            continue;
        }
        const rolePermission = await ctx.db
            .query("rolePermissions") // Assuming "rolePermissions" is the table for role-permission links
            .withIndex("by_role_permission", (q) => q.eq("roleId", roleId).eq("permissionKey", permissionKey))
            .first(); // A role should only have one entry per permission key
        if (rolePermission) {
            const level = rolePermission.level;
            if (levelsOrder.indexOf(level) > levelsOrder.indexOf(highestLevel)) {
                highestLevel = level;
            }
        }
        // Optimization: if 'all' is found, no need to check further for this permission key
        if (highestLevel === "all")
            break;
    }
    if (highestLevel === "none")
        return false;
    // For 'own' level, resourceOwnerId must be provided and match the user
    if (highestLevel === "own" &&
        (!resourceOwnerId || resourceOwnerId !== userId))
        return false;
    // For 'group' level, ensure the scope is not global (group implies a specific scopeId should exist)
    if (highestLevel === "group" && scopeType === "global")
        return false;
    return true;
};
/**
 * Throw an error if user doesn't have the required permission
 */
export const requirePermission = async (ctx, permissionKey, scopeType = "global", scopeId, resourceOwnerId) => {
    const userId = await getAuthenticatedUserDocIdByToken(ctx); // Use the local function
    const hasPerm = await hasPermission(ctx, userId, permissionKey, scopeType, scopeId, resourceOwnerId);
    if (!hasPerm) {
        throw new Error(`Permission denied: User ${userId} does not have permission '${permissionKey}'` +
            (scopeType !== "global"
                ? ` in scope ${scopeType}:${scopeId ?? "any"}`
                : "") +
            (resourceOwnerId ? ` on resource owned by ${resourceOwnerId}` : ""));
    }
};
// =======================================================
// UI Helper Functions (Example, might move to a UI-specific file)
// =======================================================
// Existing UI helper functions (if any) can remain here for now or be moved later.
