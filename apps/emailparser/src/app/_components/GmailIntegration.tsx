"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { GmailSignUpButton } from "./GmailSignUpButton";
import { GmailThreadViewer } from "./GmailThreadViewer";
import { SignOutButton } from "./SignOutButton";

// Type for sync job information
interface SyncJob {
  jobId: string;
  message: string;
  requestedLabels: string[];
}

// Type for sync results
interface SyncResults {
  success: boolean;
  error?: string;
  stats?: {
    totalEmailsProcessed: number;
    processedLabels: string[];
    timeElapsed: number;
    successfullyStored?: number;
    errors?: string[];
  };
}

const GmailIntegration = () => {
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncJob, setSyncJob] = useState<SyncJob | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResults | null>(null);
  const [shouldPollEmailStats, setShouldPollEmailStats] = useState(false);

  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const userId = user?.id ?? "";

  // Check if user has Gmail integration enabled
  const hasGmailIntegrationResult = useQuery(api.gmail.hasGmailIntegration);
  // Safely handle potential undefined or error state
  const hasGmailIntegration =
    hasGmailIntegrationResult !== undefined &&
    typeof hasGmailIntegrationResult === "boolean"
      ? hasGmailIntegrationResult
      : false;

  // Get user's email stats from the database - use empty object as args
  const emailStats = useQuery(api.gmail.getEmailStats, {});

  // Get user's sync preferences (selected labels)
  const syncPreferences = useQuery(api.gmail.getGmailSyncPreferences, {
    userId,
  });

  // Extract selected labels, using empty array if not available
  const selectedLabels = syncPreferences?.selectedLabelIds ?? [];

  // Effect to poll for updated email stats after a sync job completes
  useEffect(() => {
    if (!shouldPollEmailStats) return;

    // Poll every 3 seconds for 15 seconds (5 times)
    const pollCount = 5;
    let currentPoll = 0;
    // Track initial email count to detect new emails
    const initialEmailCount = emailStats ? emailStats.totalEmails : 0;

    console.log(
      "Starting email stats polling. Initial count:",
      initialEmailCount,
    );

    const pollInterval = setInterval(() => {
      currentPoll++;
      console.log(`Poll #${currentPoll} for email stats`);

      // After 5 polls (15 seconds), stop polling
      if (currentPoll >= pollCount) {
        clearInterval(pollInterval);
        setShouldPollEmailStats(false);
        setSyncInProgress(false);

        // If emailStats is available, update syncResults with real data
        if (emailStats && syncJob) {
          // Calculate how many new emails were stored during the sync
          const currentEmailCount = emailStats.totalEmails;
          const newEmailsProcessed = Math.max(
            0,
            currentEmailCount - initialEmailCount,
          );

          setSyncResults({
            success: true,
            stats: {
              totalEmailsProcessed: syncJob.requestedLabels.length || 1,
              processedLabels: syncJob.requestedLabels,
              timeElapsed: 15000, // Approximate time (15 seconds)
              successfullyStored: newEmailsProcessed,
              errors:
                newEmailsProcessed === 0
                  ? [
                      "No new emails were stored. This could be due to permission issues or no new emails matching the selected labels.",
                    ]
                  : [],
            },
          });
        }
      }
    }, 3000);

    // Clean up interval on unmount
    return () => {
      clearInterval(pollInterval);
      setShouldPollEmailStats(false);
    };
  }, [shouldPollEmailStats, emailStats, syncJob]);

  // Actions for Gmail
  const syncEmailsMutation = useMutation(api.gmail.syncEmails);

  // Handle sync button click
  const handleSyncClick = async () => {
    try {
      setSyncInProgress(true);
      setSyncResults(null);
      setSyncJob(null);

      // Start the sync job
      const job = await syncEmailsMutation({
        maxResults: 50,
        labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
      });
      console.log("Sync job started:", job);
      setSyncJob(job);

      // Set polling flag to true to start checking for email updates
      setShouldPollEmailStats(true);

      // Rather than using a timeout, let our useEffect handle showing results
      // when polling completes. The initial emailStats.totalEmails value
      // will be used to compare with updated values to determine success.
    } catch (error) {
      console.error("Error syncing emails:", error);
      setSyncInProgress(false);
      setShouldPollEmailStats(false);

      // Display error details to help with debugging
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setSyncResults({
        success: false,
        error: errorMessage,
        stats: {
          totalEmailsProcessed: 0,
          processedLabels: selectedLabels,
          timeElapsed: 0,
          errors: [errorMessage],
        },
      });
    }
  };

  // Check if user is signed in with Google
  const isGoogleAccount = user?.externalAccounts.some(
    (account) => account.provider === "google",
  );

  // Loading state - when the query is still loading
  if (hasGmailIntegrationResult === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Not connected state - when the query returns false
  if (hasGmailIntegration === false) {
    return (
      <div className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Gmail Integration
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your Gmail account to parse emails
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="border-l-4 border-orange-400 bg-orange-50 p-4 text-orange-700 dark:border-orange-500 dark:bg-orange-950/20 dark:text-orange-300">
            <p className="font-medium">Google account not connected</p>
            <p className="mt-1 text-sm">
              You need to sign in with Google and grant access to Gmail to use
              this feature.
            </p>
          </div>

          {isSignedIn && isGoogleAccount ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
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
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You're signed in with Google, but Gmail permissions are
                      missing. Please sign out and sign in again with Google to
                      grant Gmail access.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <SignOutButton
                  redirectTo="/sign-in"
                  className="w-full max-w-xs"
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 flex justify-center">
              <GmailSignUpButton className="w-full max-w-xs" />
            </div>
          )}
        </div>
        <div className="border-t px-6 py-4 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Signing in with Google will allow this application to access your
            emails for parsing. We only request read access to your emails.
          </p>
        </div>
      </div>
    );
  }

  // Connected state - when the query returns true
  return (
    <div className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b px-6 py-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Gmail Integration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Parse and process emails from your Gmail account
            </p>
          </div>
          <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800/20 dark:text-green-400">
            Connected
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="space-y-4">
          <div className="border-l-4 border-green-400 bg-green-50 p-4 text-green-700 dark:border-green-500 dark:bg-green-950/20 dark:text-green-300">
            <p className="font-medium">Your Gmail account is connected</p>
            <p className="mt-1 text-sm">
              You can now sync emails from your Gmail account to parse and
              process them.
            </p>
          </div>

          {/* Email stats card */}
          {emailStats && (
            <div className="rounded-md border p-4 dark:border-gray-700">
              <h3 className="mb-1 font-medium">Email Database</h3>
              <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                <p>{emailStats.totalEmails} emails stored</p>
                {emailStats.latestSync && (
                  <p className="text-xs">
                    Last sync:{" "}
                    {new Date(emailStats.latestSync).toLocaleString()}
                  </p>
                )}
              </div>

              {emailStats.emailsByLabel &&
                Object.keys(emailStats.emailsByLabel).length > 0 && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      Emails by label:
                    </p>
                    <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                      {Object.entries(emailStats.emailsByLabel).map(
                        ([labelId, count]) => (
                          <li key={labelId}>
                            {labelId}: {count} emails
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}

          <div className="rounded-md border p-4 dark:border-gray-700">
            <h3 className="mb-2 font-medium">Synchronization</h3>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              Click the button below to fetch recent emails from your Gmail
              account.
            </p>
            <p className="mb-4 text-xs text-blue-600 dark:text-blue-400">
              <Link
                href="/settings/connections/gmail"
                className="underline hover:text-blue-800 dark:hover:text-blue-300"
              >
                Configure which Gmail folders/labels to sync
              </Link>
            </p>
            <button
              onClick={handleSyncClick}
              disabled={syncInProgress}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {syncInProgress ? (
                <>
                  <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Syncing emails...
                </>
              ) : (
                "Sync Gmail"
              )}
            </button>

            {/* Sync Job Info */}
            {syncJob && !syncResults && (
              <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                <p>
                  <span className="font-medium">Sync started:</span> Processing
                  up to 50 emails
                </p>
                {syncJob.requestedLabels.length > 0 && (
                  <p className="mt-1">
                    <span className="font-medium">Labels:</span>{" "}
                    {syncJob.requestedLabels.join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Sync Results */}
            {syncResults && (
              <div
                className={`mt-4 rounded-md p-4 ${
                  syncResults.success
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                }`}
              >
                <h4 className="font-medium">
                  {syncResults.success ? "Sync Completed" : "Sync Failed"}
                </h4>

                {syncResults.success && syncResults.stats ? (
                  <div className="mt-2 text-sm">
                    <p>
                      <span className="font-medium">Emails processed:</span>{" "}
                      {syncResults.stats.totalEmailsProcessed}
                    </p>
                    {syncResults.stats.successfullyStored !== undefined && (
                      <p>
                        <span className="font-medium">
                          Successfully stored:
                        </span>{" "}
                        {syncResults.stats.successfullyStored}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Time taken:</span>{" "}
                      {(syncResults.stats.timeElapsed / 1000).toFixed(2)}s
                    </p>
                    {syncResults.stats.processedLabels.length > 0 && (
                      <p>
                        <span className="font-medium">Labels:</span>{" "}
                        {syncResults.stats.processedLabels.join(", ")}
                      </p>
                    )}

                    {/* Check actual database count */}
                    {emailStats && (
                      <p className="mt-2 text-xs">
                        <span className="font-medium">
                          Total emails in database:
                        </span>{" "}
                        {emailStats.totalEmails}
                      </p>
                    )}

                    {/* Display any errors as a list */}
                    {syncResults.stats.errors &&
                      syncResults.stats.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-amber-700 dark:text-amber-400">
                            Warnings:
                          </p>
                          <ul className="ml-5 mt-1 list-disc text-amber-700 dark:text-amber-400">
                            {syncResults.stats.errors.map((error, index) => (
                              <li key={index} className="text-xs">
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                ) : null}

                {!syncResults.success && syncResults.error && (
                  <p className="mt-2 text-sm">{syncResults.error}</p>
                )}
              </div>
            )}
          </div>

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
                  Required Permissions
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    This application requires the following Gmail permissions:
                  </p>
                  <ul className="ml-5 mt-2 list-disc">
                    <li>Read access to emails (gmail.readonly)</li>
                    <li>Access to email labels (gmail.labels)</li>
                  </ul>
                  <p className="mt-2">
                    If you're experiencing permission errors, please sign out
                    and sign in again to grant these permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t px-6 py-4 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Only emails from selected folders/labels will be fetched. Your data is
          securely stored and processed according to our privacy policy.
        </p>
        <div className="mt-2">
          <Link
            href="/settings/connections/gmail"
            className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            View Connection Details →
          </Link>
        </div>
      </div>
      {hasGmailIntegration && (
        <div className="mt-8">
          <GmailThreadViewer />
        </div>
      )}
    </div>
  );
};

export default GmailIntegration;
