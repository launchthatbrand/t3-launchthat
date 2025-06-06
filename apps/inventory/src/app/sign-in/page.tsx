"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { SignIn } from "@clerk/nextjs";
import { useMutation } from "convex/react";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get query parameters
  const authMethod = searchParams.get("authMethod");
  const email = searchParams.get("email");
  const userId = searchParams.get("userId");

  // Get the Convex mutation to ensure Monday user exists
  const ensureMondayUser = useMutation(api.users.mutations.ensureMondayUser);

  // Handle Monday authentication flow
  useEffect(() => {
    if (authMethod !== "monday" || !email) return;

    const handleMondayAuth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Retrieve stored user data from localStorage
        const mondayAuthData = localStorage.getItem("monday_auth_user");
        if (!mondayAuthData) {
          throw new Error("Missing Monday authentication data");
        }

        const userData = JSON.parse(mondayAuthData);

        // Create a Convex user for the Monday user
        if (userData.mondayUserId && userData.email) {
          try {
            await ensureMondayUser({
              email: userData.email,
              mondayUserId: userData.mondayUserId,
              name: userData.name || "",
              photoUrl: userData.photoUrl,
            });
            console.log("Ensured Monday user exists in Convex database");
          } catch (convexError) {
            console.error("Error ensuring Monday user in Convex:", convexError);
            // Continue with the flow even if Convex user creation fails
          }
        }

        // Redirect to dashboard
        router.push("/admin/dashboard");
      } catch (err) {
        console.error("Error handling Monday authentication:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    void handleMondayAuth();
  }, [authMethod, email, userId, router, ensureMondayUser]);

  // Show error if there was a problem with Monday auth flow
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-md border border-red-200 bg-red-50 p-4">
          <h3 className="text-lg font-medium text-red-800">
            Authentication Error
          </h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => router.push("/sign-in")}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading indicator while processing Monday auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-md border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-lg font-medium text-blue-800">
            Authenticating...
          </h3>
          <p className="mt-2 text-sm text-blue-700">
            Completing your authentication from Monday.com
          </p>
        </div>
      </div>
    );
  }

  // Default sign-in screen for non-Monday users
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Sign In</h1>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          redirectUrl="/admin/dashboard"
        />
      </div>
    </div>
  );
}
