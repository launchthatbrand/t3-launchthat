"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSocialFeedAuth } from "../context/SocialFeedClientProvider";

interface FeedInteraction {
  type: "view" | "like" | "comment" | "share";
  timestamp: number;
  itemId?: string;
}

interface FeedContextType {
  lastInteraction: FeedInteraction | null;
  trackInteraction: (type: FeedInteraction["type"], itemId?: string) => void;
}

const FeedContext = createContext<FeedContextType>({
  lastInteraction: null,
  // Default no-op function that maintains the expected signature
  trackInteraction: () => {
    // This empty function is intentional as a default placeholder
    return;
  },
});

interface FeedProviderProps {
  children: ReactNode;
}

export function FeedProvider({ children }: FeedProviderProps) {
  const [lastInteraction, setLastInteraction] =
    useState<FeedInteraction | null>(null);
  const { isAuthenticated } = useSocialFeedAuth();

  // Track when user views the feed (on component mount)
  useEffect(() => {
    if (isAuthenticated) {
      const viewInteraction: FeedInteraction = {
        type: "view",
        timestamp: Date.now(),
      };
      setLastInteraction(viewInteraction);
    }
  }, [isAuthenticated]);

  // Function to track different interactions with the feed
  const trackInteraction = (type: FeedInteraction["type"], itemId?: string) => {
    const interaction: FeedInteraction = {
      type,
      timestamp: Date.now(),
      itemId,
    };
    setLastInteraction(interaction);
  };

  return (
    <FeedContext.Provider value={{ lastInteraction, trackInteraction }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeedContext() {
  return useContext(FeedContext);
}
