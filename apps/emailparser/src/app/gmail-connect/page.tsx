"use client";

import { useUser } from "@clerk/clerk-react";

import GmailIntegration from "../_components/GmailIntegration";
import { SignOutButton } from "../_components/SignOutButton";

export default function GmailConnectPage() {
  const { user, isLoaded } = useUser();

  // Check if user has a Google account connected
  const hasGoogleAccount =
    isLoaded &&
    user?.externalAccounts.some((account) => account.provider === "google");

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold">Connect Gmail</h1>
        <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
          Connect your Gmail account to parse and analyze your emails
          automatically. We only request read-only access to your emails.
        </p>
      </div>

      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <GmailIntegration />

        {hasGoogleAccount && (
          <div className="mt-8 rounded-md bg-blue-50 p-4 dark:bg-blue-900">
            <h3 className="mb-2 font-medium text-blue-800 dark:text-blue-200">
              Need to reconnect with Gmail permissions?
            </h3>
            <p className="mb-4 text-sm text-blue-700 dark:text-blue-300">
              If you&apos;re already signed in with Google but Gmail permissions
              are missing, you&apos;ll need to sign out and sign in again to
              grant Gmail access.
            </p>
            <div className="flex justify-center">
              <SignOutButton redirectTo="/sign-in" className="w-full" />
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="mb-2 font-semibold">About Gmail Integration</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>We request read-only access to your emails</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Your data is securely stored and processed</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>You can revoke access at any time</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-red-500">✗</span>
              <span>We never send emails on your behalf</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-red-500">✗</span>
              <span>We don't store your Google password</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
