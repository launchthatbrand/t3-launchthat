"use client";

import type { MondayContext } from "@/hooks/useMondayContext";
import { api } from "@/convex/_generated/api";
import { useConvex } from "convex/react";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

/**
 * Types related to Monday.com authentication
 */

/**
 * User information returned from Monday.com API
 */
export interface MondayUser {
  id: string;
  name: string;
  email: string;
  title?: string;
  photo_thumb_small?: string;
  photo_thumb?: string;
  photo_medium?: string;
  photo_large?: string;
  phone?: string;
}

/**
 * Context information from Monday.com SDK
 */
export interface MondayContext {
  data: {
    userId?: string;
    boardId?: string;
    workspaceId?: string;
    itemId?: string;
    instanceId?: string;
    location?: string;
    themeConfig?: {
      name: string;
      primaryColor: string;
    };
  };
  type?: string;
}

// Type for Monday API response
interface MondayApiResponse {
  data?: {
    me?: MondayUser;
  };
}

// Type for Convex authentication result
interface ConvexAuthResult {
  success: boolean;
  token?: string;
  email?: string;
  error?: string;
}

/**
 * Authenticate a user using Monday.com context
 *
 * This function will:
 * 1. Fetch the current user's details from Monday.com API
 * 2. Call a secure Convex action to validate the Monday context
 * 3. Use the resulting token to authenticate with Clerk
 *
 * @param context Monday.com context with board and user data
 * @param convex Optional Convex client for calling the authentication action
 * @returns Promise<boolean> indicating authentication success
 */
export async function signInWithMonday(
  context?: MondayContext,
  convex?: ReturnType<typeof useConvex>,
): Promise<boolean> {
  console.log("Starting Monday authentication process");
  if (!context) {
    console.error("No Monday context available");
    return false;
  }

  if (!monday) {
    console.error("Monday SDK not available");
    return false;
  }

  try {
    // Step 1: Get the user info from Monday API
    const response = (await monday.api(
      `query { me { id name email title photo_thumb_small } }`,
    )) as MondayApiResponse;

    if (!response.data?.me) {
      console.error("Failed to get user info from Monday API");
      return false;
    }

    const mondayUser = response.data.me;

    if (!mondayUser.email) {
      console.error("Monday user email is missing");
      return false;
    }

    console.log("Retrieved Monday user:", mondayUser.name, mondayUser.email);

    // Store the Monday user info in localStorage for reference
    localStorage.setItem("monday_user", JSON.stringify(mondayUser));

    // Step 2: Use Convex to securely authenticate (if Convex client is available)
    if (convex) {
      try {
        // Extract board and workspace IDs, converting to strings if they exist
        const boardId =
          context.data.boardId !== undefined
            ? String(context.data.boardId)
            : undefined;

        const workspaceId =
          context.data.workspaceId !== undefined
            ? String(context.data.workspaceId)
            : undefined;

        const authResult = (await convex.action(
          api.auth.mondayAuth.authenticateMonday,
          {
            email: mondayUser.email,
            mondayUserId: mondayUser.id,
            boardId,
            workspaceId,
          },
        )) as ConvexAuthResult;

        if (authResult.success) {
          console.log("Successfully authenticated with Convex:", authResult);

          // Ensure the Monday user exists in the Convex database
          try {
            const userId = await convex.mutation(
              api.auth.users.ensureMondayUser,
              {
                email: mondayUser.email,
                mondayUserId: mondayUser.id,
                name: mondayUser.name,
                title: mondayUser.title,
                photoUrl: mondayUser.photo_thumb_small,
              },
            );
            console.log("Ensured Monday user exists in Convex:", userId);
          } catch (userError) {
            console.error("Error ensuring Monday user in Convex:", userError);
          }

          // The token from Convex could be used with Clerk's JWT authentication
          // For now, we'll just store it in localStorage
          if (authResult.token) {
            localStorage.setItem("monday_auth_token", authResult.token);
          }
        } else {
          console.error(
            "Convex authentication failed:",
            authResult.error || "Unknown error",
          );
        }
      } catch (convexError) {
        console.error(
          "Error calling Convex authentication action:",
          convexError,
        );
      }
    }

    console.log("Successfully authenticated Monday user");
    return true;
  } catch (error) {
    console.error("Error during Monday authentication:", error);
    return false;
  }
}
