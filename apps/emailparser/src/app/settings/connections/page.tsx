"use client";

import Link from "next/link";
import { useUser } from "@clerk/clerk-react";

export default function ConnectionsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Get Google account if connected
  const googleAccount = user?.externalAccounts.find(
    (account) => account.provider === "google",
  );

  // Available integrations
  const integrations = [
    {
      id: "gmail",
      name: "Gmail",
      description: "Connect to your Gmail account to import and parse emails",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="24px"
          height="24px"
          className="h-8 w-8"
        >
          <path
            fill="#4caf50"
            d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"
          />
          <path
            fill="#1e88e5"
            d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"
          />
          <polygon
            fill="#e53935"
            points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"
          />
          <path
            fill="#c62828"
            d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"
          />
          <path
            fill="#fbc02d"
            d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"
          />
        </svg>
      ),
      isConnected: Boolean(googleAccount),
      url: "/settings/connections/gmail",
    },
  ];

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Connected Services</h2>

      <div className="mb-6 rounded-lg border bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Connect your accounts to enable additional features like email
          parsing, data import, and more.
        </p>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex flex-col justify-between rounded-lg border p-4 sm:flex-row sm:items-center"
          >
            <div className="mb-4 flex items-center sm:mb-0">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                {integration.icon}
              </div>
              <div>
                <h3 className="font-medium">{integration.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {integration.description}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    integration.isConnected
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {integration.isConnected ? "Connected" : "Not Connected"}
                </span>
              </div>
              <Link
                href={integration.url}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {integration.isConnected ? "Manage" : "Connect"}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
