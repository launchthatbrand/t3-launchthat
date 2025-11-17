"use client";

import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";

interface NotificationPreference {
  inApp: Record<string, boolean>;
  email: Record<string, boolean>;
  push: Record<string, boolean>;
  pushEnabled?: boolean;
}

export function useNotificationPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get notification preferences from API
  const preferencesQuery = useQuery(
    api.notifications.preferences.getNotificationPreferences,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );

  // Process the preferences data when it loads
  useEffect(() => {
    try {
      if (preferencesQuery === undefined) {
        setIsLoading(true);
        return;
      }

      setIsLoading(false);

      if (!preferencesQuery) {
        // No preferences set, use defaults
        setPreferences({
          inApp: {
            activity: true,
            group: true,
            system: true,
            event: true,
            ecommerce: true,
            feedReactions: true,
            feedComments: true,
            feedMentions: true,
            feedShares: true,
            newFollowedPosts: true,
          },
          email: {
            activity: true,
            group: true,
            system: true,
            event: true,
            ecommerce: false,
            feedReactions: true,
            feedComments: true,
            feedMentions: true,
            feedShares: true,
            newFollowedPosts: false,
          },
          push: {
            activity: true,
            group: true,
            system: true,
            event: true,
            ecommerce: false,
            feedReactions: true,
            feedComments: true,
            feedMentions: true,
            feedShares: true,
            newFollowedPosts: false,
          },
          pushEnabled: false,
        });
      } else {
        // Extract preferences from the response
        const appPrefs = preferencesQuery.appPreferences ?? {};
        const emailPrefs = preferencesQuery.emailPreferences ?? {};

        // Map between our UI categories and the API's stored preferences
        // These mappings assume that the backend has these fields or similar ones
        const mapPreferences = (prefs: Record<string, boolean | undefined>) => {
          return {
            activity:
              prefs.mention ??
              prefs.friendRequest ??
              prefs.friendAccepted ??
              true,
            group:
              prefs.groupInvite ??
              prefs.groupJoinRequest ??
              prefs.groupJoinApproved ??
              true,
            system: prefs.systemUpdate ?? prefs.systemAnnouncement ?? true,
            event: prefs.eventReminder ?? prefs.eventUpdate ?? true,
            ecommerce: prefs.orderStatus ?? prefs.productUpdate ?? false,
            feedReactions: prefs.reaction ?? true,
            feedComments: prefs.comment ?? prefs.commentReply ?? true,
            feedMentions: prefs.mention ?? true,
            feedShares: prefs.share ?? true,
            newFollowedPosts: prefs.newFollowedUserPost ?? false,
          };
        };

        setPreferences({
          inApp: mapPreferences(appPrefs),
          email: mapPreferences(emailPrefs),
          // The API doesn't have pushPreferences, so we'll use appPreferences as a fallback
          push: mapPreferences(appPrefs),
          pushEnabled: preferencesQuery.pushEnabled ?? false,
        });
      }
    } catch (err) {
      console.error("Error processing notification preferences:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setIsLoading(false);
    }
  }, [preferencesQuery]);

  return { preferences, isLoading, error };
}
