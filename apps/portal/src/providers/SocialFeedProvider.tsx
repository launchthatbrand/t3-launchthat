/* eslint-disable react-compiler/react-compiler */
"use client";

import type { SocialFeedHooks } from "launchthat-plugin-socialfeed/context/SocialFeedClientProvider";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { SocialFeedProvider } from "launchthat-plugin-socialfeed/context/SocialFeedClientProvider";

import { useConvexUser } from "~/hooks/useConvexUser";

const usePortalSocialFeedAuth = () => {
  const { convexId } = useConvexUser();
  return { userId: convexId ?? null };
};

export function PortalSocialFeedProvider({
  children,
}: {
  children: ReactNode;
}) {
  const hooks = useMemo<SocialFeedHooks>(
    () => ({
      useQuery: useQuery as SocialFeedHooks["useQuery"],
      useMutation: useMutation as SocialFeedHooks["useMutation"],
      useAuth: usePortalSocialFeedAuth,
      useConvexAuth,
    }),
    [],
  );

  const value = useMemo(
    () => ({
      api: api as unknown as Record<string, unknown>,
      hooks,
    }),
    [hooks],
  );

  return <SocialFeedProvider value={value}>{children}</SocialFeedProvider>;
}
