"use client";

import * as React from "react";
import { useConvexAuth } from "convex/react";

/**
 * Shared version of Portal’s ConvexUserEnsurer.
 *
 * Apps pass a mutation trigger function (e.g. from `useMutation(...)`) so this
 * component stays package-agnostic about which Convex function is used.
 */
export function ConvexUserEnsurer(props: {
  triggerEnsureUser: () => Promise<unknown>;
}) {
  const { isAuthenticated } = useConvexAuth();

  React.useEffect(() => {
    if (!isAuthenticated) return;
    props.triggerEnsureUser().catch((error) => {
      console.error("[ConvexUserEnsurer] Failed to ensure Convex user:", error);
    });
  }, [isAuthenticated, props]);

  return null;
}

