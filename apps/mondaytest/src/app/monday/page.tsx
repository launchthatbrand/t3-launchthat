"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Correct import for App Router
import { useClerk } from "@clerk/nextjs"; // Standard import for setActive
import { useAction } from "convex/react";

import type { MondayUser } from "../../hooks/useMondayContext";
import { api } from "../../../convex/_generated/api";
import { useMondayIntegration } from "../../hooks/useMondayContext";

function AuthenticateWithClerkFlow({ sessionToken }: { sessionToken: string }) {
  const router = useRouter();
  const { setActive } = useClerk();
  const [status, setStatus] = useState("Logging in with Clerk...");

  useEffect(() => {
    if (!sessionToken) {
      setStatus("No session token provided.");
      return;
    }

    const login = async () => {
      try {
        await setActive({ session: sessionToken });
        setStatus("Successfully logged in! Redirecting...");
        router.push("/dashboard"); // Adjust dashboard path as needed
      } catch (errUnknown: unknown) {
        console.error("Clerk setActive failed:", errUnknown);
        const message =
          errUnknown instanceof Error ? errUnknown.message : String(errUnknown);
        setStatus(`Login failed: ${message || "Unknown error"}`);
      }
    };

    void login();
  }, [sessionToken, router, setActive]);

  return <p>{status}</p>;
}

export default function MondayAuthPage() {
  const {
    isInMonday,
    isLoading: isLoadingMonday,
    mondayUser,
  } = useMondayIntegration();

  // For the line below: if you see a TypeScript error like "Property 'users' does not exist on type '{}'",
  // it likely means your Convex generated types are stale.
  // Run `npx convex dev` or `npx convex generate` in your terminal to update them.
  const createOrGetClerkUser = useAction(
    api.users.createOrGetClerkUserFromMonday,
  );

  const [clerkSessionToken, setClerkSessionToken] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (
      !isLoadingMonday &&
      isInMonday &&
      mondayUser &&
      !clerkSessionToken &&
      !processing &&
      !error
    ) {
      const processUser = async (user: MondayUser) => {
        setProcessing(true);
        setError(null);
        try {
          console.log("Monday user found:", user);
          if (!user.email) {
            setError(
              "Monday user email is missing. Cannot proceed with Clerk authentication.",
            );
            setProcessing(false);
            return;
          }
          const mondayUserIdString = String(user.id);

          // Ensure the result type matches the return type from the Convex action
          type ConvexActionResult = Awaited<
            ReturnType<typeof createOrGetClerkUser>
          >;

          const result: ConvexActionResult = await createOrGetClerkUser({
            mondayUser: {
              id: mondayUserIdString,
              email: user.email,
              name: user.name,
            },
          });
          console.log("Clerk user processed:", result);
          if (result && result.sessionToken) {
            setClerkSessionToken(result.sessionToken);
          } else {
            setError(
              "Failed to get session token from Clerk user processing, or result was unexpected.",
            );
          }
        } catch (eUnknown: unknown) {
          console.error("Failed to create or get Clerk user:", eUnknown);
          const message =
            eUnknown instanceof Error ? eUnknown.message : String(eUnknown);
          setError(message || "An unexpected error occurred.");
        } finally {
          setProcessing(false);
        }
      };

      void processUser(mondayUser);
    }
  }, [
    isInMonday,
    isLoadingMonday,
    mondayUser,
    createOrGetClerkUser,
    clerkSessionToken,
    processing,
    error,
  ]);

  if (isLoadingMonday) {
    return <p>Loading Monday context...</p>;
  }

  if (!isInMonday) {
    return (
      <p>
        This app is designed to be used within Monday.com. Please open it from
        your Monday.com board.
      </p>
    );
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (processing) {
    return <p>Processing Monday user with Clerk...</p>;
  }

  if (clerkSessionToken) {
    return <AuthenticateWithClerkFlow sessionToken={clerkSessionToken} />;
  }

  if (!mondayUser) {
    return (
      <p>
        Waiting for Monday.com user information... Ensure you are logged into
        Monday.
      </p>
    );
  }

  return <p>Preparing authentication...</p>;
}
