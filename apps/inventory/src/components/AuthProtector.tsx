"use client";

import { ReactNode } from "react";
import { useMondayContext } from "@/hooks/useMondayContext";
import { useAuth } from "@clerk/nextjs";

import { MondayAuthenticator } from "./MondayAuthenticator";

interface AuthProtectorProps {
  children: ReactNode;
}

/**
 * AuthProtector - Component that protects content based on authentication state
 *
 * Note: Authentication is now primarily managed by ConvexUserEnsurer at the app root.
 * This component remains for backwards compatibility and for specific page-level protection.
 */
export function AuthProtector({ children }: AuthProtectorProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { isInMonday, context, isLoading: mondayLoading } = useMondayContext();

  // Loading state when waiting for auth or Monday context
  if (!isLoaded || mondayLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-lg font-medium text-gray-800">Loading...</h3>
          <p className="mt-2 text-sm text-gray-600">
            Checking authentication status
          </p>
        </div>
      </div>
    );
  }

  // If the user is signed in, show the protected content
  if (isSignedIn) {
    return <>{children}</>;
  }

  // If we're in Monday context, use the MondayAuthenticator for seamless auth
  if (isInMonday) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Authentication Required
          </h2>

          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-lg font-medium text-blue-800">
              Monday.com Context Detected
            </h3>
            {context && (
              <div className="mt-2 text-sm text-blue-700">
                <p>Board ID: {context.data.boardId}</p>
                <p>Workspace ID: {context.data.workspaceId}</p>
                <p>Location: {context.data.location}</p>
                <p>Theme: {context.data.themeConfig?.name}</p>
              </div>
            )}
          </div>

          <MondayAuthenticator />

          <p className="mt-4 text-sm text-gray-600">
            Authenticating automatically via Monday.com...
          </p>
        </div>
      </div>
    );
  }

  // Standard auth required message for direct access
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Authentication Required
        </h2>
        <p className="mb-4 text-gray-600">
          Please sign in to access this page.
        </p>
        <a
          href="/sign-in"
          className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign In
        </a>
      </div>
    </div>
  );
}
