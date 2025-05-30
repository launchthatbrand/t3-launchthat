import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "convex/react";

import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

/**
 * A hook that returns the Convex user object and ID corresponding to the currently logged-in Clerk user.
 *
 * @returns An object containing:
 *   - user: The full Convex user object (if found) or null
 *   - convexId: The Convex user ID (if found) or null
 *   - isLoading: True if the user data is still being loaded
 */
export function useConvexUser() {
  const { userId: clerkId, isLoaded: isClerkLoaded } = useAuth();

  const user = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip",
  );

  // User is still loading if Clerk hasn't loaded or if the query is still running
  const isLoading = !isClerkLoaded || (clerkId && user === undefined);

  // Only return the ID if we have a valid user
  const convexId = user ? (user._id as Id<"users">) : null;

  return {
    user,
    convexId,
    isLoading,
  };
}
