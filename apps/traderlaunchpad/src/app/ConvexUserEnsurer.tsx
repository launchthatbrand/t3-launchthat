"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";

import { api } from "@convex-config/_generated/api";

const readCookie = (key: string): string | null => {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(`${key}=`)) continue;
    const value = part.slice(`${key}=`.length);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
};

/**
 * Portal-parity: ensure the Convex `users` row exists (and is kept in sync)
 * on the auth host where Clerk-backed Convex identity includes name/email/picture.
 */
export function ConvexUserEnsurer() {
  const { isAuthenticated } = useConvexAuth();
  const triggerEnsureUser = useMutation(api.coreTenant.mutations.createOrGetUser);
  const attributeMySignup = useMutation(api.traderlaunchpad.affiliates.attributeMySignup);
  const didRunRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (didRunRef.current) return;
    didRunRef.current = true;

    triggerEnsureUser()
      .then(() => {
        const visitorId = readCookie("lt_aff_vid") ?? undefined;
        const referralCode = readCookie("lt_aff_ref") ?? undefined;
        if (!visitorId && !referralCode) return;
        return attributeMySignup({ visitorId, referralCode });
      })
      .catch((error) => {
        console.error("[ConvexUserEnsurer] Failed to ensure/attribute user:", error);
      });
  }, [attributeMySignup, isAuthenticated, triggerEnsureUser]);

  return null;
}

