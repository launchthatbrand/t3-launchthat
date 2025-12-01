"use client";

import { useSocialFeedAuth } from "../context/SocialFeedClientProvider";

export function useConvexUser() {
  const { userId, isAuthenticated } = useSocialFeedAuth();

  return {
    convexId: userId,
    userId,
    isAuthenticated,
  };
}
