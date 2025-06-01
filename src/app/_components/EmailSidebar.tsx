"use client";

import { FC, useEffect, useState } from "react";

import { GmailConnection } from "./GmailConnection";
import { useEmailParserStore } from "../../store";
import { useGmail } from "../../hooks/useGmail";

// Mock data for emails when not using Gmail
const MOCK_EMAILS = [
  {
    id: "email1",
    subject: "Invoice #1234",
    from: "billing@example.com",
    date: "2023-05-15",
  },
  {
    id: "email2",
    subject: "Welcome to Our Service",
    from: "support@company.com",
    date: "2023-05-12",
  },
  {
    id: "email3",
    subject: "Your Appointment Confirmation",
    from: "appointments@healthcare.org",
    date: "2023-05-10",
  },
];

export const EmailSidebar: FC = () => {
  const selectedEmailId = useEmailParserStore((s) => s.selectedEmailId);
  const setSelectedEmailId = useEmailParserStore((s) => s.setSelectedEmailId);

  const { isAuthenticated, isLoading, emailList, loadedEmails, fetchEmail } =
    useGmail();

  const [displayEmails, setDisplayEmails] = useState<
    {
      id: string;
      subject?: string;
      from?: string;
      date?: string;
    }[]
  >([]);

  // Update display emails based on Gmail connection
  useEffect(() => {
    if (isAuthenticated && emailList.length > 0) {
      // Format Gmail emails for display
      const formatted = emailList.map((email) => {
        const loaded = loadedEmails[email.id];
        return {
          id: email.id,
          subject: loaded?.subject || "Loading...",
          from: loaded?.from || "Loading...",
          date: loaded?.date || "Loading...",
        };
      });
      setDisplayEmails(formatted);
    } else {
      // Fall back to mock data when not using Gmail
      setDisplayEmails(MOCK_EMAILS);
    }
  }, [isAuthenticated, emailList, loadedEmails]);

  const handleSelectEmail = async (id: string) => {
    if (isAuthenticated) {
      // For Gmail emails, fetch content if not already loaded
      await fetchEmail(id);
    } else {
      // For mock emails, just set the ID
      setSelectedEmailId(id);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      <h2 className="mb-4 text-lg font-medium text-gray-900">Emails</h2>

      {/* Gmail connection component */}
      <GmailConnection />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading emails...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {displayEmails.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              No emails available
            </p>
          ) : (
            <ul className="space-y-2">
              {displayEmails.map((email) => (
                <li key={email.id}>
                  <button
                    onClick={() => void handleSelectEmail(email.id)}
                    className={`w-full rounded-md p-3 text-left transition-colors ${
                      selectedEmailId === email.id
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">{email.subject}</div>
                    <div className="mt-1 text-sm text-gray-500">
                      From: {email.from}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {email.date}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
