"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

function SignInPageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mondayToken = searchParams.get("monday_token");
  const redirectUrl = searchParams.get("redirect_url");
  const [processingMondayToken, setProcessingMondayToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have a Monday token, process it
    if (mondayToken && !processingMondayToken) {
      setProcessingMondayToken(true);

      try {
        // Define the expected token structure
        interface MondayTokenData {
          mondayUserId: string;
          email: string;
          name: string;
          timestamp: number;
        }

        // Decode the token
        const decoded = JSON.parse(atob(mondayToken)) as MondayTokenData;

        // In a real implementation, we would:
        // 1. Validate the token (check timestamp is recent)
        // 2. Use Clerk's signIn.create() to create a user
        // 3. Set up the session
        console.log("Monday token data:", decoded);

        // For demo purposes, we'll just redirect to the standard sign-in flow
        // where the user would be auto-registered if their email matches

        // In a production app, you would implement a proper sign-in flow here
        // that creates/authenticates the user based on the Monday.com data
        // For example:
        // const { signIn } = useSignIn();
        // await signIn.create({
        //   identifier: decoded.email,
        //   strategy: "email_code",
        // });

        // Redirect to the standard sign-in but with the email prefilled
        if (redirectUrl) {
          router.push(
            `/sign-in?email=${encodeURIComponent(decoded.email)}&redirect_url=${encodeURIComponent(redirectUrl)}`,
          );
        } else {
          router.push(`/sign-in?email=${encodeURIComponent(decoded.email)}`);
        }
      } catch (err) {
        console.error("Error processing Monday token:", err);
        setError("Invalid authentication token");
        setProcessingMondayToken(false);
      }
    }
  }, [mondayToken, processingMondayToken, redirectUrl, router]);

  if (processingMondayToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-lg">Processing your Monday.com sign-in...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
          <p>{error}</p>
        </div>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          onClick={() => router.push("/sign-in")}
        >
          Continue to sign-in
        </button>
      </div>
    );
  }

  // Use Clerk's SignIn component for standard sign-in
  return <SignIn />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Loading sign-in…</div>}>
      <SignInPageBody />
    </Suspense>
  );
}
