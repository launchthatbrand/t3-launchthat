import { hasPermission, isAdmin } from "../../lib/permissions/hasPermission";
import { getAuthenticatedUser } from "../../lib/permissions/userAuth";
/**
 * Check if the user has permission to manage products
 *
 * @param ctx - The Convex context (query or mutation)
 * @returns Whether the user has permission to manage products
 */
export async function canManageProducts(ctx) {
    return await hasPermission(ctx, "canManageProducts");
}
/**
 * Check if the user has permission to manage orders
 *
 * @param ctx - The Convex context (query or mutation)
 * @returns Whether the user has permission to manage orders
 */
export async function canManageOrders(ctx) {
    return await hasPermission(ctx, "canManageOrders");
}
/**
 * Check if the user can view and modify their own orders
 *
 * @param ctx - The Convex context (query or mutation)
 * @returns Whether the user has permission to view their orders
 */
export async function canViewOrders(ctx) {
    return ((await hasPermission(ctx, "canViewOrders")) ||
        (await hasPermission(ctx, "canManageOrders")));
}
/**
 * Check if the user can create orders
 *
 * @param ctx - The Convex context (query or mutation)
 * @returns Whether the user has permission to create orders
 */
export async function canCreateOrders(ctx) {
    return await hasPermission(ctx, "canCreateOrders");
}
/**
 * Check if the user is an admin
 *
 * @param ctx - The Convex context (query or mutation)
 * @returns Whether the user is an admin
 */
export async function isUserAdmin(ctx) {
    return await isAdmin(ctx);
}
/**
 * Get the authenticated user ID
 *
 * @param ctx - The Convex context (query or mutation)
 * @returns The authenticated user ID
 * @throws If the user is not authenticated
 */
export async function getAuthenticatedUserId(ctx) {
    const user = await getAuthenticatedUser(ctx);
    return user._id;
}
