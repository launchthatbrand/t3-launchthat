"use client";

import type { MondayClientSdk } from "monday-sdk-js";
import { useEffect, useMemo, useState } from "react";
import mondaySdkInitialize from "monday-sdk-js";

/**
 * Typings for Monday.com SDK context
 */
export interface MondayUser {
  id: string;
  email: string;
  name?: string;
  title?: string;
  photo_thumb_small?: string;
}

// Combined and more comprehensive MondayContext
export interface MondayContext {
  boardId?: number | string; // Can be number or string
  workspaceId?: number | string;
  itemId?: number | string;
  instanceId?: string | number;
  appInstanceId?: string;
  appVersionId?: string;
  userId?: number;
  user?: {
    // Detailed user object often provided by context
    id: number;
    is_guest: boolean;
    is_admin: boolean;
    time_zone_identifier: string;
    country_code: string;
  };
  themeConfig?: {
    name: string;
    iconStyle?: string;
    primaryColor?: string;
    // From user example, potentially nested differently or part of a broader theme object
    colors?: {
      light?: Record<string, string>;
      dark?: Record<string, string>;
      black?: Record<string, string>;
    };
  };
  location?: string;
  locationContext?: {
    // From user example
    boardId?: number; // Ensure types align if these are duplicates (e.g. top-level boardId)
    workspaceId?: number;
  };
  viewMode?: string;
  theme?: string; // e.g., 'light', 'dark' (often separate from themeConfig)
  app_id?: number;
  app_slug?: string;
  account_id?: number;
  boardIds?: number[]; // Plural, often a list
  itemIds?: number[]; // Plural
  viewInstanceId?: string;
  workspaceIds?: number[]; // Plural
  instanceType?: string;
  isConnected?: boolean;
  locale?: string;
  [key: string]: unknown; // For any other properties
}

// This type was unused after refactoring.
// interface MondaySessionTokenResponse {
//     data?: {
//         token?: string;
//         [key: string]: unknown;
//     };
//     [key: string]: unknown;
// }

interface MondayContextResponse {
  data: MondayContext;
  [key: string]: unknown;
}

interface MondayApiMeQueryResponse {
  data?: {
    me?: MondayUser;
  };
  errors?: { message: string; [key: string]: unknown }[]; // Changed Array<T> to T[]
  account_id?: number;
}

export function useMondayIntegration(): {
  isInMonday: boolean | null;
  isLoading: boolean;
  mondayContext: MondayContext | null;
  mondayUser: MondayUser | null;
  mondaySdk: MondayClientSdk | null;
} {
  const [isInMonday, setIsInMonday] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mondayContext, setMondayContext] = useState<MondayContext | null>(
    null,
  );
  const [mondayUser, setMondayUser] = useState<MondayUser | null>(null);

  const monday = useMemo(() => {
    // mondaySdkInitialize is the default export from 'monday-sdk-js'
    const sdk: MondayClientSdk = mondaySdkInitialize();
    // It's good practice to set API version if your app depends on a specific one
    sdk.setApiVersion("2023-10");
    return sdk;
  }, []);

  useEffect(() => {
    async function initMondayIntegration() {
      if (typeof window === "undefined" || window === window.parent) {
        // Not in an iframe or SSR context
        setIsInMonday(false);
        setIsLoading(false);
        return;
      }
      try {
        // monday.get("sessionToken") might not be standard for all apps/views.
        // The core is usually getting the 'context'.
        // For authentication with an external backend (like Clerk via Convex),
        // you often rely on information within the context (like user ID/email)
        // or a specific token if the Monday app provides one for this purpose.

        const contextResponse = (await monday.get(
          "context",
        )) as MondayContextResponse;

        if (contextResponse.data) {
          const currentContext = contextResponse.data;
          setMondayContext(currentContext);
          setIsInMonday(true); // Assume in Monday if context is successfully retrieved

          // Fetch Monday user details using monday.api
          try {
            const userApiResponse = (await monday.api(
              `query { me { id name email title photo_thumb_small } }`,
            )) as MondayApiMeQueryResponse;

            if (userApiResponse.data?.me) {
              setMondayUser(userApiResponse.data.me);
            } else if (
              userApiResponse.errors &&
              userApiResponse.errors.length > 0
            ) {
              console.error(
                "Error fetching Monday user from API:",
                userApiResponse.errors.map((e) => e.message).join("; "),
              );
            } else {
              console.warn(
                "No 'me' data in Monday API response and no errors reported.",
              );
            }
          } catch (apiError) {
            console.error(
              "Exception during Monday API call for user details:",
              apiError,
            );
          }
        } else {
          console.warn("Failed to get valid context from Monday.com SDK.");
          setIsInMonday(false);
        }
      } catch (error) {
        console.error("Error initializing Monday.com integration:", error);
        setIsInMonday(false);
      } finally {
        setIsLoading(false);
      }
    }

    void initMondayIntegration();
  }, [monday]); // Dependency array includes monday SDK instance

  return {
    isInMonday,
    isLoading,
    mondayContext,
    mondayUser,
    mondaySdk: monday,
  };
}
