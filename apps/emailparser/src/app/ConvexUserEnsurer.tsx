"use client";

import { useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";

import { api } from "../../convex/_generated/api";

export function ConvexUserEnsurer() {
  const { isAuthenticated } = useConvexAuth();
  const triggerEnsureUser = useMutation(api.users.createOrGetUser);

  useEffect(() => {
    if (isAuthenticated) {
      console.log(
        "ConvexUserEnsurer: User authenticated, ensuring Convex user exists...",
      );

      try {
        void triggerEnsureUser();
      } catch (error) {
        console.error(
          "ConvexUserEnsurer: Failed to ensure user in Convex:",
          error,
        );
      }
    }
  }, [isAuthenticated, triggerEnsureUser]);

  return null; // This component doesn't render anything visible
}
