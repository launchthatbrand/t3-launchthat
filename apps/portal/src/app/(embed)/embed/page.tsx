"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { useMondayContext } from "~/hooks/useMondayContext";

export default function EmbedPage() {
  const router = useRouter();
  const { isInMonday, isLoading, context } = useMondayContext();
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authAttempted, setAuthAttempted] = useState(false);

  // Define the authentication function outside of useEffect to avoid recreation
  const authenticateWithMonday = useCallback(async () => {
    if (!isInMonday || !context || authenticating) return;

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
        // Redirect to the sign-in URL
        router.push(data.signInUrl);
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
  }, [isInMonday, context, authenticating, router]);

  useEffect(() => {
    // Only attempt authentication once when the component mounts and context is available
    if (isInMonday && context && !authAttempted && !authenticating) {
      void authenticateWithMonday();
    }
  }, [
    isInMonday,
    context,
    authenticateWithMonday,
    authAttempted,
    authenticating,
  ]);

  const handleAuthButtonClick = () => {
    if (isInMonday) {
      setError(null);
      setAuthAttempted(false);
      void authenticateWithMonday();
    } else {
      window.open("https://monday.com", "_blank");
    }
  };

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Portal Embed Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || authenticating ? (
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="ml-3 text-muted-foreground">
                {authenticating ? "Authenticating..." : "Loading..."}
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
                <h3 className="mb-2 font-semibold">Monday.com Integration</h3>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isInMonday ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <p>
                    {isInMonday
                      ? "Embedded in Monday.com"
                      : "Not embedded in Monday.com"}
                  </p>
                </div>
              </div>

              {isInMonday && context && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="mb-2 font-semibold">Context Information</h3>
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
                      {context.data.themeConfig && (
                        <p>
                          <span className="font-medium">Theme:</span>{" "}
                          {context.data.themeConfig.name}
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
                    ? error
                      ? "Retry Authentication"
                      : "Authenticate with Monday"
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
