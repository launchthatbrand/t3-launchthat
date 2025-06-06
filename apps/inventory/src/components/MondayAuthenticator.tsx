"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMondayContext } from "@/hooks/useMondayContext";
import { MondayUser } from "@/lib/auth/mondayAuth";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import mondaySdk from "monday-sdk-js";

// Initialize the Monday SDK
const monday = mondaySdk();

// Monday API response type
interface MondayApiResponse {
  data?: {
    me?: MondayUser;
  };
}

// Clerk authentication result type
interface ClerkAuthResult {
  success: boolean;
  email?: string;
  userId?: string;
  verification?: {
    strategy: string;
    redirectUrl: string;
    identifier: string;
  };
  error?: string;
}

// Add proper types for Clerk's API
interface EmailCodeFactor {
  strategy: "email_code";
  emailAddressId: string;
}

interface PhoneCodeFactor {
  strategy: "phone_code";
  phoneNumberId: string;
}

type SignInFactor = EmailCodeFactor | PhoneCodeFactor;

export function MondayAuthenticator() {
  const router = useRouter();
  const { isInMonday, isLoading } = useMondayContext();
  const convex = useConvex();
  const { isSignedIn } = useClerk();
  const { signIn } = useSignIn();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mondayUser, setMondayUser] = useState<MondayUser | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState(0);

  useEffect(() => {
    // Only attempt authentication if in Monday.com iframe
    if (!isInMonday || isAuthenticating || isLoading || isSignedIn) return;

    // Simple rate limiting - wait longer between retries
    const now = Date.now();
    if (
      retryCount > 0 &&
      now - lastRetryTime < Math.min(retryCount * 2000, 30000)
    ) {
      return;
    }

    async function authenticateWithMonday() {
      setIsAuthenticating(true);
      setError(null);

      try {
        console.log("Starting Monday-Clerk seamless authentication");

        // Step 1: Get the Monday user info
        const response = (await monday.api(
          `query { me { id name email title photo_thumb_small } }`,
        )) as MondayApiResponse;

        if (!response.data?.me) {
          throw new Error("Failed to get user info from Monday API");
        }

        const user = response.data.me;
        setMondayUser(user);
        console.log("Retrieved Monday user:", user);

        // Step 2: Call Convex action to authenticate with Clerk
        const authResult = (await convex.action(
          api.auth.clerkAuth.createOrLoginWithMonday,
          {
            email: user.email,
            mondayUserId: user.id,
            name: user.name,
            photoUrl: user.photo_thumb_small,
          },
        )) as ClerkAuthResult;

        if (!authResult.success) {
          throw new Error(authResult.error ?? "Authentication failed");
        }

        console.log("Successfully created/found Clerk user", authResult);

        // Step 3: Use a direct login approach instead of email verification
        // to avoid rate limiting issues
        if (signIn) {
          try {
            // Store user info in localStorage so we can access it on the sign-in page
            localStorage.setItem(
              "monday_auth_user",
              JSON.stringify({
                email: user.email,
                name: user.name,
                mondayUserId: user.id,
                clerkUserId: authResult.userId,
              }),
            );

            // Redirect to sign-in page with a special flag
            router.push(
              `/sign-in?authMethod=monday&email=${encodeURIComponent(user.email)}&userId=${authResult.userId}`,
            );
            return;
          } catch (signInError) {
            console.error("Error with Clerk auth flow:", signInError);
            throw new Error(
              `Auth flow error: ${signInError instanceof Error ? signInError.message : String(signInError)}`,
            );
          }
        } else {
          throw new Error("Clerk signIn method not available");
        }
      } catch (err) {
        // Increment retry count if we hit rate limits
        if (
          String(err).includes("429") ||
          String(err).includes("Too many requests")
        ) {
          setRetryCount((prev) => prev + 1);
          setLastRetryTime(Date.now());
          console.log(
            `Rate limited by Clerk. Will retry later (attempt ${retryCount + 1})`,
          );
        }

        console.error("Monday-Clerk authentication failed:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsAuthenticating(false);
      }
    }

    void authenticateWithMonday();
  }, [
    isInMonday,
    isAuthenticating,
    isLoading,
    isSignedIn,
    convex,
    signIn,
    router,
    retryCount,
    lastRetryTime,
  ]);

  // Don't render anything visible for this component
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <h3 className="text-lg font-medium text-red-800">
          Authentication Error
        </h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        {mondayUser && (
          <div className="mt-2">
            <p className="text-sm text-gray-700">
              Monday User: {mondayUser.name} ({mondayUser.email})
            </p>
          </div>
        )}
        {retryCount > 0 && (
          <div className="mt-2">
            <p className="text-sm text-yellow-700">
              Retrying authentication... (Attempt {retryCount})
            </p>
          </div>
        )}
      </div>
    );
  }

  if (isAuthenticating) {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-lg font-medium text-blue-800">Authenticating...</h3>
        <p className="mt-2 text-sm text-blue-700">
          Connecting to Monday.com and authenticating your account
        </p>
      </div>
    );
  }

  return null;
}
