"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";

import type { GmailLabel } from "../../../../lib/gmail/useGmailLabels";
import { GoogleOAuthButton } from "../../../_components/GoogleOAuthButton";
import { SignOutButton } from "../../../_components/SignOutButton";
import { api } from "../../../../../convex/_generated/api";
import { useGmailLabels } from "../../../../lib/gmail/useGmailLabels";

// Interface for Clerk Google Account
interface GoogleAccount {
  id: string;
  provider: string;
  emailAddress: string;
  approvedScopes?: string;
  // Explicitly allow specific properties we know about
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  externalId?: string;
}

// Component to compare required scopes with available scopes
function ScopesComparison({
  requiredScopes,
  googleAccount,
}: {
  requiredScopes: string[];
  googleAccount: GoogleAccount | null | undefined;
}) {
  if (!googleAccount) {
    return null;
  }

  // Extract granted scopes from the Google account
  const grantedScopes = googleAccount.approvedScopes
    ? googleAccount.approvedScopes.split(" ")
    : [];

  return (
    <div className="rounded-lg border p-6 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-medium">Scopes Comparison</h3>
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">Required Gmail Scopes</h4>
          <ul className="space-y-1 rounded-md border bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            {requiredScopes.map((scope: string, index: number) => {
              const hasScope = grantedScopes.includes(scope);
              return (
                <li
                  key={index}
                  className={`flex items-center text-sm ${
                    hasScope
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  <span
                    className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                      hasScope
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {hasScope ? "✓" : "✗"}
                  </span>
                  {scope}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium">Available Scopes</h4>
          <div className="max-h-60 overflow-y-auto rounded-md border bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            {grantedScopes.length > 0 ? (
              <ul className="space-y-1">
                {grantedScopes.map((scope: string, index: number) => (
                  <li
                    key={index}
                    className={`text-sm ${
                      requiredScopes.includes(scope)
                        ? "text-green-700 dark:text-green-400"
                        : "text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {scope}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-400">
                No scopes available
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Total Scopes: {grantedScopes.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GmailConnectionPage() {
  const { user, isLoaded } = useUser();
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Get Google account if connected
  const googleAccount = user?.externalAccounts.find(
    (account) => account.provider === "google",
  ) as GoogleAccount | undefined;

  // Use our custom hook for Gmail labels
  const {
    labels,
    isLoading: isLabelsLoading,
    error: labelsError,
    refreshLabels,
    setLabels,
  } = useGmailLabels();

  // Fetch required Gmail scopes from backend
  const requiredGmailScopesQuery = useQuery(api.gmail.getRequiredGmailScopes);
  const requiredGmailScopes = requiredGmailScopesQuery ?? [];

  // Safely use the mutation without TypeScript errors
   
  const updateSyncPreferencesMutation = useMutation(
    api.gmail.updateSyncPreferences as any,
  );

  // Check if required scopes are granted
  const hasRequiredScopes = () => {
    if (!googleAccount?.approvedScopes || requiredGmailScopes.length === 0) {
      return false;
    }
    const grantedScopes = googleAccount.approvedScopes.split(" ");
    return requiredGmailScopes.every((scope: string) =>
      grantedScopes.includes(scope),
    );
  };

  // Load component data
  useEffect(() => {
    const loadComponentData = () => {
      if (!isLoaded || !user) {
        setIsTokenLoading(false);
        return;
      }

      // Simple timeout to simulate checking for scopes
      const timeout = setTimeout(() => {
        setIsTokenLoading(false);
      }, 500);

      // Clean up timeout if component unmounts
      return () => clearTimeout(timeout);
    };

    loadComponentData();
  }, [isLoaded, user]);

  // Handle label selection
  const handleLabelToggle = (labelId: string) => {
    setLabels((prevLabels) =>
      prevLabels.map((label) =>
        label.id === labelId ? { ...label, selected: !label.selected } : label,
      ),
    );
    // Reset success message when changes are made
    setSaveSuccess(false);
  };

  // Handle save preferences
  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      // Get selected label IDs
      const selectedLabelIds = labels
        .filter((label) => label.selected)
        .map((label) => label.id);

      // Save to Convex
      await updateSyncPreferencesMutation({ selectedLabelIds });
      setSaveSuccess(true);
    } catch (error) {
      console.error("Error saving label preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Select all system labels
  const handleSelectSystemLabels = () => {
    setLabels((prevLabels) =>
      prevLabels.map((label) =>
        label.type === "system" ? { ...label, selected: true } : label,
      ),
    );
    setSaveSuccess(false);
  };

  // Select all user labels
  const handleSelectUserLabels = () => {
    setLabels((prevLabels) =>
      prevLabels.map((label) =>
        label.type === "user" ? { ...label, selected: true } : label,
      ),
    );
    setSaveSuccess(false);
  };

  // Clear all selections
  const handleClearSelections = () => {
    setLabels((prevLabels) =>
      prevLabels.map((label) => ({ ...label, selected: false })),
    );
    setSaveSuccess(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Helper to check if the labels data is loaded
  const hasLabels = labels.length > 0;

  // Check if we're connected but missing required scopes
  // Use our hasRequiredScopes function instead of relying on empty labels
  const isConnectedButMissingScopes =
    googleAccount !== undefined && !hasRequiredScopes();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gmail Connection</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your Gmail integration settings
          </p>
        </div>
        <Link
          href="/settings/connections"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Back to Connections
        </Link>
      </div>

      {/* Important Notice about Clerk Configuration */}
      <div className="mb-6 rounded-md border border-orange-200 bg-orange-50 p-4 dark:border-orange-800/30 dark:bg-orange-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-orange-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">
              Important: Clerk OAuth Configuration Required
            </h3>
            <div className="mt-2 text-sm text-orange-700 dark:text-orange-200">
              <p>
                There is a known issue with Gmail integration. Please make sure:
              </p>
              <ol className="ml-5 mt-1 list-decimal">
                <li>
                  You have configured the required Gmail scopes in your Clerk
                  Dashboard
                </li>
                <li>
                  You are signing in directly with Google (not email+password)
                </li>
                <li>
                  Review the troubleshooting steps at the bottom of this page
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {isTokenLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : googleAccount ? (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="rounded-lg border p-6 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Connection Status</h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isConnectedButMissingScopes
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                }`}
              >
                {isConnectedButMissingScopes ? "Scopes Missing" : "Connected"}
              </span>
            </div>

            {/* Special Notice about Clerk Configuration */}
            <div className="mb-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400 dark:text-blue-300"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Important: Configure Clerk to Support Gmail
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      This application requires specific Gmail API scopes to be
                      configured in your Clerk dashboard. Please make sure you
                      add the following scopes to your Clerk Google OAuth
                      configuration:
                    </p>
                    <ul className="mt-2 list-disc pl-5">
                      <li>https://www.googleapis.com/auth/gmail.readonly</li>
                      <li>https://www.googleapis.com/auth/gmail.labels</li>
                      <li>https://www.googleapis.com/auth/gmail.metadata</li>
                    </ul>
                    <p className="mt-2">
                      After updating your Clerk configuration, sign out and sign
                      back in with Google to refresh your permissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account
                  </span>
                  <span className="block font-medium">
                    {googleAccount.emailAddress}
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Provider
                  </span>
                  <span className="block font-medium capitalize">
                    {googleAccount.provider}
                  </span>
                </div>
              </div>
            </div>

            {isConnectedButMissingScopes && (
              <div className="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400 dark:text-yellow-300"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Gmail Permissions Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>
                        Your Google account is connected, but it's missing the
                        required Gmail permissions. Please sign out and sign
                        back in with Google to grant the necessary Gmail access.
                      </p>
                      <div className="mt-3">
                        <SignOutButton
                          redirectTo="/sign-in"
                          className="rounded-md bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800/30 dark:text-yellow-300 dark:hover:bg-yellow-800/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400 dark:text-blue-300"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    About OAuth Scopes
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      OAuth scopes determine what your Google account allows
                      this application to access. If you're experiencing issues
                      with Gmail integration, you may need to sign out and sign
                      in again to grant the necessary permissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gmail Label Selection */}
          {!isConnectedButMissingScopes && (
            <div className="rounded-lg border p-6 dark:border-gray-700">
              <h3 className="mb-4 text-lg font-medium">
                Folder/Label Sync Settings
              </h3>

              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Select which Gmail labels (folders) you want to sync with the
                email parser. Only emails with these labels will be imported
                during synchronization.
              </p>

              {/* Selection tools */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={handleSelectSystemLabels}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  disabled={isLabelsLoading || !hasLabels}
                >
                  Select System Labels
                </button>
                <button
                  onClick={handleSelectUserLabels}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  disabled={isLabelsLoading || !hasLabels}
                >
                  Select Custom Labels
                </button>
                <button
                  onClick={handleClearSelections}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  disabled={isLabelsLoading || !hasLabels}
                >
                  Clear All
                </button>
              </div>

              {/* Label list */}
              {isLabelsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : !hasLabels ? (
                <div className="rounded-md bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                  <p>
                    No Gmail labels found. Make sure your Gmail account is
                    properly connected with the necessary permissions.
                    {labelsError && (
                      <span className="mt-1 block font-medium">
                        Error: {labelsError}
                      </span>
                    )}
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => void refreshLabels()}
                      className="rounded-md bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800/30 dark:text-yellow-300 dark:hover:bg-yellow-800/40"
                    >
                      Refresh Labels
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 max-h-80 overflow-y-auto rounded-md border p-2 dark:border-gray-700">
                  <div className="mb-2 border-b pb-2 dark:border-gray-700">
                    <h4 className="text-sm font-medium">System Labels</h4>
                    <div className="mt-2 space-y-2">
                      {labels
                        .filter((label) => label.type === "system")
                        .map((label) => (
                          <div
                            key={label.id}
                            className="flex items-center rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <label className="flex w-full cursor-pointer items-center p-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                                checked={label.selected}
                                onChange={() => handleLabelToggle(label.id)}
                              />
                              <span className="ml-2 text-sm">{label.name}</span>
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium">Custom Labels</h4>
                    <div className="mt-2 space-y-2">
                      {labels
                        .filter((label) => label.type === "user")
                        .map((label) => (
                          <div
                            key={label.id}
                            className="flex items-center rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <label className="flex w-full cursor-pointer items-center p-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                                checked={label.selected}
                                onChange={() => handleLabelToggle(label.id)}
                              />
                              <span className="ml-2 text-sm">{label.name}</span>
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Save button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSavePreferences}
                  disabled={isSaving || isLabelsLoading || !hasLabels}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </button>

                {saveSuccess && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Preferences saved successfully!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Scopes Comparison */}
          <ScopesComparison
            requiredScopes={requiredGmailScopes}
            googleAccount={googleAccount}
          />

          {/* OAuth Scopes */}
          <div className="rounded-lg border p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-medium">Required OAuth Scopes</h3>

            <div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Below are the Gmail API scopes needed for full functionality
                with this application:
              </p>

              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium">Gmail API Scopes</h4>
                <ul className="space-y-1 rounded-md border bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  {requiredGmailScopes.map((scope: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm text-green-700 dark:text-green-400"
                    >
                      {scope}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium">Basic OAuth Scopes</h4>
                <ul className="space-y-1 rounded-md border bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  {["email", "profile", "openid"].map(
                    (scope: string, index: number) => (
                      <li
                        key={index}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        {scope}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-lg border p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-medium">Actions</h3>

            {/* Sign in directly with Google section */}
            <div className="mb-6 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400 dark:text-yellow-300"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Try Direct Google Sign-in
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      The most reliable way to connect Gmail is to sign out
                      completely and sign in directly with Google. This ensures
                      the OAuth process gets the correct scopes.
                    </p>
                    <ol className="mt-2 list-decimal pl-5 text-sm">
                      <li>Sign out using the button below</li>
                      <li>
                        When redirected to the sign-in page, click "Continue
                        with Google"
                      </li>
                      <li>
                        Make sure to grant all requested permissions when
                        prompted
                      </li>
                    </ol>
                    <div className="mt-3">
                      <SignOutButton
                        redirectTo="/sign-in"
                        className="rounded-md bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800/30 dark:text-yellow-300 dark:hover:bg-yellow-800/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Link
                  href="/gmail-connect"
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Manage Gmail Integration
                </Link>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Go to the Gmail connection page to sync your emails
                </p>
              </div>

              <div>
                <SignOutButton
                  className="inline-flex items-center"
                  redirectTo="/settings/connections/gmail"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Sign out and sign in again to update your Gmail permissions
                </p>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          <div className="rounded-lg border p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-medium">Debug Information</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              If you're experiencing issues with Gmail integration, you can use
              this debug information to help identify the problem.
            </p>

            {/* Authentication Method */}
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">
                Authentication Method
              </h4>
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Current Auth Provider
                    </span>
                    <span
                      className={`block text-sm font-medium ${
                        googleAccount.provider === "google"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {googleAccount.provider === "google"
                        ? "Google (Correct)"
                        : `${googleAccount.provider} (Should be Google)`}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Login Method
                    </span>
                    <span className="block text-sm">
                      {user?.primaryEmailAddress?.verification.strategy ||
                        "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      External Accounts
                    </span>
                    <div className="mt-1 max-h-40 overflow-y-auto rounded-md bg-gray-100 p-2 dark:bg-gray-700">
                      <ul className="list-disc space-y-1 pl-5">
                        {user?.externalAccounts.length ? (
                          user.externalAccounts.map((account, index) => (
                            <li key={index} className="text-xs">
                              {account.provider} - {account.emailAddress}
                              {account === googleAccount && " (Current)"}
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-red-500">
                            No external accounts connected
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OAuth Token Information */}
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">
                Google Account Information
              </h4>
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Provider
                    </span>
                    <span className="block text-sm capitalize">
                      {googleAccount.provider}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </span>
                    <span className="block text-sm">
                      {googleAccount.emailAddress}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Token Identifier
                    </span>
                    <span className="block break-all text-sm">
                      {googleAccount.id}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Token Format
                    </span>
                    <span
                      className={`block text-sm ${googleAccount.id.startsWith("oauth_google") ? "text-green-600" : "text-red-600"}`}
                    >
                      {googleAccount.id.startsWith("oauth_google")
                        ? "Valid format (starts with oauth_google)"
                        : "Invalid format (should start with oauth_google)"}
                    </span>
                  </div>
                  {googleAccount.approvedScopes && (
                    <div>
                      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Scopes (formatted)
                      </span>
                      <div className="mt-1 max-h-40 overflow-y-auto rounded-md bg-gray-100 p-2 dark:bg-gray-700">
                        <ul className="list-disc space-y-1 pl-5">
                          {googleAccount.approvedScopes
                            .split(" ")
                            .map((scope, index) => (
                              <li key={index} className="text-xs">
                                {scope}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gmail Labels Error */}
            {labelsError && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-red-500">
                  Gmail Labels Error
                </h4>
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {labelsError}
                  </p>
                </div>
              </div>
            )}

            {/* Troubleshooting Steps */}
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-medium">
                Troubleshooting Steps
              </h4>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                <li>
                  <strong>Configure Clerk OAuth Scopes:</strong> Go to your
                  Clerk Dashboard, select your application, navigate to JWT
                  Templates, then Social Connections, and ensure the following
                  scopes are added to Google OAuth:
                  <ul className="ml-4 mt-1 list-disc text-xs">
                    <li>https://www.googleapis.com/auth/gmail.readonly</li>
                    <li>https://www.googleapis.com/auth/gmail.labels</li>
                    <li>https://www.googleapis.com/auth/gmail.metadata</li>
                  </ul>
                </li>
                <li>
                  <strong>Check Clerk Configuration:</strong> Ensure your Clerk
                  OAuth providers are correctly configured for Gmail scopes.
                </li>
                <li>
                  <strong>Set OAuth Callback:</strong> Make sure your Clerk
                  Google OAuth callback URI is properly set to your
                  application's domain + '/api/auth/callback/google'.
                </li>
                <li>
                  <strong>Google Cloud Console Setup:</strong> In your Google
                  Cloud Console project, ensure you've enabled the Gmail API and
                  configured the OAuth consent screen to include the required
                  scopes.
                </li>
                <li>
                  <strong>Check Server Logs:</strong> Open your terminal and
                  check the Convex server logs for error messages related to
                  OAuth or Gmail API.
                </li>
                <li>
                  <strong>Sign Out and Sign In:</strong> Try signing out
                  completely and signing back in with Google to refresh your
                  OAuth tokens.
                </li>
                <li>
                  <strong>Check Token Format:</strong> Your token identifier
                  should start with "oauth_google". If not, you may need to
                  update your Clerk configuration.
                </li>
                <li>
                  <strong>Clear Browser Cache:</strong> Clear your browser's
                  cache and cookies, then try again.
                </li>
                <li>
                  <strong>Check Gmail API Status:</strong> Verify that the Gmail
                  API is not experiencing any outages.
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-2">
              <SignOutButton
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                redirectTo="/settings/connections/gmail"
              />
              <button
                onClick={() => {
                  window.location.href = "/gmail-connect";
                }}
                className="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reconnect Gmail
              </button>
            </div>
          </div>

          {/* Try Direct Sign In */}
          <div className="mt-6 rounded-lg border p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-medium">
              Connect Directly with Google
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              If you're experiencing issues with Gmail integration, try signing
              in directly with Google. This method ensures the OAuth process
              correctly captures all required scopes.
            </p>

            <div className="mb-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400 dark:text-blue-300"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Follow these steps:
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <ol className="list-decimal space-y-2 pl-5">
                      <li>
                        Sign out first to clear any existing authentication
                        state
                      </li>
                      <li>Click the "Connect with Google" button below</li>
                      <li>
                        Review and grant{" "}
                        <strong>all requested permissions</strong>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <p className="mb-2 text-sm font-medium">Step 1: Sign Out</p>
                <SignOutButton
                  redirectTo="/sign-in"
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                />
              </div>

              <div className="flex items-center">
                <div className="w-12 border-t border-gray-300 dark:border-gray-600"></div>
                <div className="mx-4 text-gray-500 dark:text-gray-400">or</div>
                <div className="w-12 border-t border-gray-300 dark:border-gray-600"></div>
              </div>

              <div className="text-center">
                <p className="mb-2 text-sm font-medium">
                  Step 2: Connect with Google
                </p>
                <GoogleOAuthButton buttonText="Connect with Google" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border p-6 dark:border-gray-700">
          <div className="mb-4 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium">Gmail Not Connected</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You haven't connected your Gmail account yet.
            </p>
          </div>

          <div className="flex justify-center">
            <Link
              href="/gmail-connect"
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Connect Gmail
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
