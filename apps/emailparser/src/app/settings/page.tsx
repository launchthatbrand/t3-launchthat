"use client";

import { useUser } from "@clerk/clerk-react";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">General Settings</h2>

      <div className="mb-8 rounded-lg border p-6 dark:border-gray-700">
        <h3 className="mb-4 text-xl font-medium">Account Information</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <div className="mt-1 text-gray-900 dark:text-gray-100">
                {user?.fullName ?? "Not provided"}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="mt-1 text-gray-900 dark:text-gray-100">
                {user?.primaryEmailAddress?.emailAddress ?? "Not provided"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Account Created
            </label>
            <div className="mt-1 text-gray-900 dark:text-gray-100">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleString()
                : "Unknown"}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-lg border p-6 dark:border-gray-700">
        <h3 className="mb-4 text-xl font-medium">Connected Accounts</h3>

        <div className="space-y-2">
          {user?.externalAccounts && user.externalAccounts.length > 0 ? (
            user.externalAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center">
                  <div className="font-medium capitalize">
                    {account.provider}
                  </div>
                  {account.emailAddress && (
                    <div className="ml-2 text-sm text-gray-500">
                      ({account.emailAddress})
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">Connected</div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No external accounts connected
            </p>
          )}
        </div>

        <div className="mt-4">
          <a
            href="/settings/connections"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Manage connections →
          </a>
        </div>
      </div>
    </div>
  );
}
