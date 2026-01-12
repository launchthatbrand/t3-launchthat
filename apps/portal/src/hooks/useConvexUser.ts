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
   * Use `getMe` so we can resolve the current user across BOTH:
   * - Clerk-backed Convex auth (tokenIdentifier lookup)
   * - Server-minted Convex tokens (fallback to identity.subject / clerkId)
   */
  const user = useQuery(api.core.users.queries.getMe, {});

  const isLoading = user === undefined;

  // Only return the ID if we have a valid user
  const convexId = user ? (user._id as Id<"users">) : null;

  return {
    user,
    convexId,
    isLoading,
  };
}
