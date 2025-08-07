"use client";

import type { FC} from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileNavigationProps {
  className?: string;
}

export const MobileNavigation: FC<MobileNavigationProps> = ({
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState("emails");
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      setActiveTab("emails");
    } else if (pathname === "/templates") {
      setActiveTab("templates");
    } else if (pathname === "/test") {
      setActiveTab("test");
    } else if (pathname === "/gmail-connect") {
      setActiveTab("gmail");
    } else if (pathname.startsWith("/settings")) {
      setActiveTab("settings");
    }
  }, [pathname]);

  return (
    <div
      className={`fixed bottom-0 left-0 z-10 flex w-full border-t bg-white shadow-lg md:hidden ${className}`}
    >
      <Link
        href="/"
        className={`flex flex-1 flex-col items-center p-3 text-xs ${
          activeTab === "emails" ? "text-blue-600" : "text-gray-500"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mb-1 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        Emails
      </Link>
      <Link
        href="/templates"
        className={`flex flex-1 flex-col items-center p-3 text-xs ${
          activeTab === "templates" ? "text-blue-600" : "text-gray-500"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mb-1 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Templates
      </Link>
      <Link
        href="/gmail-connect"
        className={`flex flex-1 flex-col items-center p-3 text-xs ${
          activeTab === "gmail" ? "text-blue-600" : "text-gray-500"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mb-1 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
        Gmail
      </Link>
      <Link
        href="/settings"
        className={`flex flex-1 flex-col items-center p-3 text-xs ${
          activeTab === "settings" ? "text-blue-600" : "text-gray-500"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mb-1 h-6 w-6"
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
        Settings
      </Link>
      <Link
        href="/test"
        className={`flex flex-1 flex-col items-center p-3 text-xs ${
          activeTab === "test" ? "text-blue-600" : "text-gray-500"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mb-1 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        Test
      </Link>
    </div>
  );
};
