import { hasPermission, isAdmin } from "./hasPermission";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser } from "./userAuth";
/**
 * Requires that the user has a specific permission, throwing an error if not
 *
 * @param ctx - The Convex context (query or mutation)
 * @param permissionKey - The permission key to check
 * @param options - Additional options for permission checking
 * @throws ConvexError if the user doesn't have the required permission
 */
export const requirePermission = async (ctx, permissionKey, options) => {
    // Check if the user has the required permission
    const hasAccess = await hasPermission(ctx, permissionKey, options);
    if (!hasAccess) {
        throw new ConvexError(options?.errorMessage ??
            `Forbidden: You don't have permission to perform this action (${permissionKey})`);
    }
};
/**
 * Requires that the user has access to a specific resource, throwing an error if not
 *
 * @param ctx - The Convex context
 * @param permissionKey - The permission key to check
 * @param resourceOwnerId - The ID of the resource owner
 * @param options - Additional options for permission checking
 * @throws ConvexError if the user doesn't have access to the resource
 */
export const requireResourceAccess = async (ctx, permissionKey, resourceOwnerId, options) => {
    const user = await getAuthenticatedUser(ctx);
    // Check if the user is the resource owner
    const isOwner = user._id.toString() === resourceOwnerId.toString();
    // If the user is the owner, no need to check permissions
    if (isOwner) {
        return;
    }
    // Check if the user has the required permission
    const hasAccess = await hasPermission(ctx, permissionKey, {
        ...options,
        resourceOwnerId,
    });
    if (!hasAccess) {
        throw new ConvexError(options?.errorMessage ??
            `Forbidden: You don't have permission to access this resource`);
    }
};
/**
 * Requires that the user is an admin, throwing an error if not
 *
 * @param ctx - The Convex context
 * @param errorMessage - Optional custom error message
 * @throws ConvexError if the user is not an admin
 */
export const requireAdmin = async (ctx, errorMessage) => {
    const admin = await isAdmin(ctx);
    console.log("[requireAdmin]", admin);
    if (!admin) {
        throw new ConvexError(errorMessage ?? "Forbidden: Admin privileges required");
    }
};
/**
 * Requires that the user is authenticated, throwing an error if not
 *
 * @param ctx - The Convex context
 * @param errorMessage - Optional custom error message
 * @throws ConvexError if the user is not authenticated
 */
export const requireAuthentication = async (ctx, errorMessage) => {
    try {
        // This will throw if the user is not authenticated
        await getAuthenticatedUser(ctx);
    }
    catch (error) {
        // If getAuthenticatedUser throws, throw with the custom error message
        if (error instanceof ConvexError) {
            throw new ConvexError(errorMessage ?? error.message);
        }
        throw error;
    }
};
