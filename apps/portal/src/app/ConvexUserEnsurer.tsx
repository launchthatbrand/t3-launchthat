"use client";

import { useEffect } from "react";
import { api } from "@convex-config/_generated/api"; // Use the identified path
import { useConvexAuth, useMutation } from "convex/react";

export function ConvexUserEnsurer() {
  const { isAuthenticated } = useConvexAuth();
  const triggerEnsureUser = useMutation(
    api.core.users.mutations.createOrGetUser,
  );

  useEffect(() => {
    if (isAuthenticated) {
      console.log(
        "ConvexUserEnsurer: User authenticated, ensuring Convex user exists via public wrapper...",
      );
      triggerEnsureUser().catch((error) => {
        console.error(
          "ConvexUserEnsurer: Failed to ensure user in Convex via public wrapper:",
          error,
        );
      });
    }
  }, [isAuthenticated, triggerEnsureUser]);

  return null; // This component doesn't render anything visible
}
