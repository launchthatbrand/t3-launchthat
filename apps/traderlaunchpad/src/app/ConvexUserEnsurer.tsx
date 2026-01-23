"use client";

import { useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";

import { api } from "@convex-config/_generated/api";

/**
 * Portal-parity: ensure the Convex `users` row exists (and is kept in sync)
 * on the auth host where Clerk-backed Convex identity includes name/email/picture.
 */
export function ConvexUserEnsurer() {
  const { isAuthenticated } = useConvexAuth();
  const triggerEnsureUser = useMutation(api.coreTenant.mutations.createOrGetUser);

  useEffect(() => {
    if (!isAuthenticated) return;
    triggerEnsureUser().catch((error) => {
      console.error("[ConvexUserEnsurer] Failed to ensure Convex user:", error);
    });
  }, [isAuthenticated, triggerEnsureUser]);

  return null;
}

