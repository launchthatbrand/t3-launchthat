"use client";

import type { NextPage } from "next";
import Link from "next/link";
import { Toaster } from "sonner";

import { AuthRequired } from "./_components/AuthRequired";
import { ConfirmDialog } from "./_components/ConfirmDialog";
import { EmailContent } from "./_components/EmailContent";
import { EmailSidebar } from "./_components/EmailSidebar";
import { FieldsSidebar } from "./_components/FieldsSidebar";
import { JsonPreview } from "./_components/JsonPreview";
import { KeyboardShortcuts } from "./_components/KeyboardShortcuts";
import { MobileNavigation } from "./_components/MobileNavigation";
import { MobileTabSwitcher } from "./_components/MobileTabSwitcher";

const Home: NextPage = () => {
  return (
    <AuthRequired>
      <main className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <div className="flex h-full">
          {/* Mobile Navigation (Hidden on Desktop) */}
          <MobileNavigation className="fixed bottom-0 left-0 right-0 z-10 block md:hidden" />

          {/* Desktop Navigation (Hidden on Mobile) */}
          <div className="hidden border-r border-gray-200 dark:border-gray-800 md:block">
            <div className="flex h-screen w-64 flex-col overflow-y-auto">
              <div className="flex items-center justify-between p-4">
                <h1 className="text-xl font-bold">Email Parser</h1>
                <div className="space-x-2">
                  <Link
                    href="/templates"
                    className="rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Templates
                  </Link>
                  <Link
                    href="/gmail-connect"
                    className="rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Gmail
                  </Link>
                  <Link
                    href="/settings"
                    className="rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
              <EmailSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <EmailContent />
          </div>

          {/* Fields Sidebar */}
          <FieldsSidebar />
        </div>

        {/* Mobile Tab Switcher (Hidden on Desktop) */}
        <MobileTabSwitcher />

        {/* Global UI Components */}
        <JsonPreview />
        <ConfirmDialog />
        <KeyboardShortcuts />
        <Toaster />
      </main>
    </AuthRequired>
  );
};

export default Home;
