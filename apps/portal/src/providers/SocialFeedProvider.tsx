"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@portal/convexspec";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { SocialFeedProvider } from "launchthat-plugin-socialfeed/context/SocialFeedClientProvider";

export function PortalSocialFeedProvider({
  children,
}: {
  children: ReactNode;
}) {
  const hooks = useMemo(
    () => ({
      useQuery,
      useMutation,
      useAuth,
      useConvexAuth,
    }),
    [],
  );

  const value = useMemo(
    () => ({
      api,
      hooks,
    }),
    [hooks],
  );

  return <SocialFeedProvider value={value}>{children}</SocialFeedProvider>;
}
