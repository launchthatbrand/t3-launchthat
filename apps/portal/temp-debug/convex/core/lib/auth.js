/**
 * Retrieves the authenticated user's ID (subject) from the context.
 * Throws an error if the user is not authenticated.
 *
 * @param ctx - The Convex query, mutation, or action context.
 * @returns The authenticated user's ID (subject).
 * @throws Error if the user is not authenticated.
 */
export async function getAuthenticatedUserId(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("User not authenticated. Unable to retrieve user identity.");
    }
    // Assuming the subject is the user's ID in the "users" table.
    // If your user ID / subject comes from a different source or has a different type,
    // adjust the return type and casting accordingly.
    return identity.subject;
}
/**
 * Retrieves the authenticated user's identity object.
 * Returns null if the user is not authenticated.
 *
 * @param ctx - The Convex query, mutation, or action context.
 * @returns The user identity object or null if not authenticated.
 */
export async function getOptionalAuthenticatedUserIdentity(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    return identity;
}
/**
 * Retrieves the authenticated user's ID (subject) from the context.
 * Returns null if the user is not authenticated.
 *
 * @param ctx - The Convex query, mutation, or action context.
 * @returns The authenticated user's ID (subject) or null.
 */
export async function getOptionalAuthenticatedUserId(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject;
    return subject ? subject : null;
}
