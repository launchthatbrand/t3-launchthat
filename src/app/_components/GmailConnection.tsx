"use client";

import { FC, useEffect } from "react";

import { useEmailParserStore } from "../../store";
import { useGmail } from "../../hooks/useGmail";

export const GmailConnection: FC = () => {
  const {
    isAuthenticated,
    isAuthenticating,
    isLoading,
    error,
    emailList,
    fetchEmails,
    getLoginUrl,
    logout,
  } = useGmail();

  const showToast = useEmailParserStore((s) => s.showToast);

  useEffect(() => {
    // Check for auth=success or auth=failed in URL params
    const url = new URL(window.location.href);
    const authStatus = url.searchParams.get("auth");

    if (authStatus === "success") {
      showToast("success", "Successfully connected to Gmail");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authStatus === "failed") {
      showToast("error", "Failed to connect to Gmail");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showToast]);

  return (
    <div className="mb-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-medium text-gray-700">
        Gmail Connection
      </h3>

      {isAuthenticated ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Connected to Gmail</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => void fetchEmails()}
              disabled={isLoading}
              className="flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {isLoading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading Emails...
                </>
              ) : (
                <>Refresh Emails</>
              )}
            </button>

            <button
              onClick={logout}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Disconnect
            </button>
          </div>

          {emailList.length > 0 && (
            <div className="text-sm text-gray-600">
              {emailList.length} emails available
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">
              Not connected to Gmail
            </span>
          </div>

          <a
            href={getLoginUrl()}
            className={`inline-flex items-center rounded-md ${
              isAuthenticating
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            } px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            onClick={(e) => {
              if (isAuthenticating) {
                e.preventDefault();
              }
            }}
          >
            {isAuthenticating ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>Connect to Gmail</>
            )}
          </a>

          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <p>
          Your credentials are stored locally and never sent to our servers.
        </p>
      </div>
    </div>
  );
};
