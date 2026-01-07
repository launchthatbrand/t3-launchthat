import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * A hook that returns the Convex user object and ID corresponding to the currently logged-in Clerk user.
 *
 * @returns An object containing:
 *   - user: The full Convex user object (if found) or null
 *   - convexId: The Convex user ID (if found) or null
 *   - isLoading: True if the user data is still being loaded
 */
export function useConvexUser() {
  /**
   * IMPORTANT:
   * Tenant/custom hosts intentionally do NOT mount <ClerkProvider />, so we must
   * never call Clerk hooks here.
   *
   * `getUserByClerkId` already prefers the authenticated Convex identity
   * (tokenIdentifier) when available, so we can safely pass a placeholder
   * clerkId and still resolve "current user" whenever Convex auth is set.
   */
  const user = useQuery(api.core.users.queries.getUserByClerkId, {
    clerkId: "__self__",
  });

  const isLoading = user === undefined;

  // Only return the ID if we have a valid user
  const convexId = user ? (user._id as Id<"users">) : null;

  return {
    user,
    convexId,
    isLoading,
  };
}
