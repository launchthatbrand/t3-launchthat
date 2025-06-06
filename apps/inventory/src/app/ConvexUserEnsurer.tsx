"use client";

import { useEffect } from "react";
import { useMondayContext } from "@/hooks/useMondayContext";
import { useAuth } from "@clerk/nextjs";
import { api } from "@convex-config/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";

/**
 * This component ensures that when a user is authenticated with Clerk,
 * they also have a corresponding user record in Convex.
 *
 * It also handles the Clerk-Convex synchronization but delegates
 * the Monday.com authentication to the MondayAuthenticator component.
 */
export function ConvexUserEnsurer() {
  const { isAuthenticated } = useConvexAuth();
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const { isInMonday } = useMondayContext();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const triggerEnsureUser = useMutation(api.users.ensureUser);

  // When authenticated with Clerk, ensure the user exists in Convex
  useEffect(() => {
    // Make sure Clerk is loaded and the user is signed in before ensuring the Convex user
    if (isAuthenticated && isSignedIn) {
      console.log(
        "ConvexUserEnsurer: User authenticated with Clerk, ensuring Convex user exists...",
      );
      triggerEnsureUser().catch((error) => {
        console.error(
          "ConvexUserEnsurer: Failed to ensure user in Convex:",
          error,
        );
      });
    }
  }, [isAuthenticated, isSignedIn, triggerEnsureUser]);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("ConvexUserEnsurer: Authentication state");
    console.log("  - isAuthenticated (Convex):", isAuthenticated);
    console.log("  - isSignedIn (Clerk):", isSignedIn);
    console.log("  - clerkLoaded:", clerkLoaded);
    console.log("  - isInMonday:", isInMonday);
  }, [isAuthenticated, isSignedIn, clerkLoaded, isInMonday]);

  return null; // This component doesn't render anything visible
}
