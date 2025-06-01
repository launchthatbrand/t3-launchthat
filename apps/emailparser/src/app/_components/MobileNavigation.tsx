"use client";

import { FC, useEffect, useState } from "react";
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
