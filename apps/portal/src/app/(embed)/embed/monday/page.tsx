"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { useMondayContext } from "~/hooks/useMondayContext";

export default function MondayEmbedPage() {
  const router = useRouter();
  const { isInMonday, isLoading, context } = useMondayContext();
  const [authenticating, setAuthenticating] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authAttempted, setAuthAttempted] = useState(false);

  // Define the authentication function outside of useEffect to avoid recreation
  const authenticateWithMonday = useCallback(async () => {
    if (!isInMonday || !context || authenticating || authenticated) return;

    try {
      setAuthenticating(true);

      // Call our API to authenticate with Monday context
      const response = await fetch("/api/auth/monday", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionToken: true, // In a real implementation, this would be the actual token
          context: context,
          redirectUrl: "/dashboard",
        }),
      });

      // Define the response type
      interface MondayAuthResponse {
        success: boolean;
        signInUrl?: string;
        error?: string;
      }

      const data = (await response.json()) as MondayAuthResponse;

      if (data.success && data.signInUrl) {
        setAuthenticated(true);
      } else {
        setError(data.error ?? "Failed to authenticate with Monday.com");
      }
    } catch (err) {
      console.error("Error authenticating with Monday:", err);
      setError("An unexpected error occurred");
    } finally {
      setAuthenticating(false);
      setAuthAttempted(true);
    }
  }, [isInMonday, context, authenticating, authenticated, router]);

  useEffect(() => {
    // Only attempt authentication once when the component mounts and context is available
    if (
      isInMonday &&
      context &&
      !authAttempted &&
      !authenticated &&
      !authenticating
    ) {
      void authenticateWithMonday();
    }
  }, [
    isInMonday,
    context,
    authenticateWithMonday,
    authAttempted,
    authenticated,
    authenticating,
  ]);

  const handleAuthButtonClick = () => {
    if (isInMonday && !authenticated) {
      setError(null);
      setAuthAttempted(false);
      void authenticateWithMonday();
    } else if (authenticated) {
      router.push("/dashboard");
    } else {
      window.open("https://monday.com", "_blank");
    }
  };

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Monday.com Integration</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || authenticating ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">
                {authenticating
                  ? "Authenticating with Monday.com..."
                  : "Loading Monday.com context..."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                  <p>{error}</p>
                </div>
              )}

              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-semibold">Connection Status</h3>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isInMonday ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <p>
                    {isInMonday
                      ? "Connected to Monday.com"
                      : "Not in Monday.com context"}
                  </p>
                </div>
              </div>

              {authenticated && (
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <h3 className="mb-2 font-semibold text-green-700 dark:text-green-300">
                    Authentication Successful
                  </h3>
                  <p className="text-green-600 dark:text-green-400">
                    Your Monday.com account is now connected to Portal. You can
                    access all your Portal content directly from Monday.com.
                  </p>
                </div>
              )}

              {isInMonday && context && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="mb-2 font-semibold">
                      Monday.com Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      {context.data.boardId && (
                        <p>
                          <span className="font-medium">Board ID:</span>{" "}
                          {context.data.boardId}
                        </p>
                      )}
                      {context.data.workspaceId && (
                        <p>
                          <span className="font-medium">Workspace ID:</span>{" "}
                          {context.data.workspaceId}
                        </p>
                      )}
                      {context.data.location && (
                        <p>
                          <span className="font-medium">Location:</span>{" "}
                          {context.data.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  variant="primary"
                  disabled={authenticating}
                  onClick={handleAuthButtonClick}
                >
                  {isInMonday
                    ? authenticated
                      ? "Go to Dashboard"
                      : error
                        ? "Retry Authentication"
                        : "Connect Monday Account"
                    : "Open in Monday.com"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
