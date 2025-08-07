"use client";

import type { FC} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useEmailParserStore } from "../../store";

// Import formatDate function
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);

  // If the date is today, just show the time
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // If the date is this year, show the month and day
  const isThisYear = date.getFullYear() === today.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  // Otherwise show the full date
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export interface EmailItem {
  _id: Id<"emails">;
  subject: string;
  sender: string;
  receivedAt: number;
  content: string;
  userId?: string;
  labels?: string[];
}

export const EmailSidebar: FC = () => {
  const selectedEmailId = useEmailParserStore((s) => s.selectedEmailId);
  const setSelectedEmailId = useEmailParserStore((s) => s.setSelectedEmailId);
  const [_cursor, _setCursor] = useState<string | null>(null);
  const [allEmails, setAllEmails] = useState<EmailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);

  // Use Convex query to fetch emails
  const emailsResult = useQuery(api.emails.list);

  // Use for initial data loading (will be replaced with pagination)
  useEffect(() => {
    // First, make sure emailsResult is an array and has items
    if (emailsResult && emailsResult.length > 0) {
      setAllEmails(emailsResult);

      // If we have emails but no selection, select the first one
      if (!selectedEmailId && emailsResult[0]?._id) {
        setSelectedEmailId(String(emailsResult[0]._id));
      }
    }
  }, [emailsResult, selectedEmailId, setSelectedEmailId]);

  // Format date for display
  const getFormattedDate = (timestamp: number) => {
    return formatDate(timestamp);
  };

  // Handle scroll event to implement infinite scrolling
  const handleScroll = useCallback(() => {
    if (!listRef.current || !hasMore || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (scrolledToBottom) {
      loadMoreEmails();
    }
  }, [hasMore, isLoading]);

  // Function to load more emails
  const loadMoreEmails = () => {
    setIsLoading(true);
    // Simulated - in a real implementation, you would use paginatedList
    // const results = await convex.query(api.emails.paginatedList, {
    //   paginationOpts: { numItems: 10, cursor },
    //   sortDirection: "desc"
    // });

    // For now, just simulate the pagination behavior
    setTimeout(() => {
      setIsLoading(false);

      // If we already have all emails from the non-paginated query,
      // there's no need to simulate more
      if (emailsResult && allEmails.length <= emailsResult.length) {
        setHasMore(false);
      }
    }, 500);
  };

  // Add scroll event listener
  useEffect(() => {
    const currentListRef = listRef.current;
    if (currentListRef) {
      currentListRef.addEventListener("scroll", handleScroll);
      return () => {
        currentListRef.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-gray-50">
      <div className="border-b p-4 text-lg font-bold">Emails</div>
      {allEmails.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-gray-500">
          <p>No emails available. Add an email to get started.</p>
        </div>
      ) : (
        <ul ref={listRef} className="flex-1 overflow-y-auto">
          {allEmails.map((email) => (
            <li
              key={String(email._id)}
              className={
                "cursor-pointer border-b px-4 py-3 hover:bg-gray-100 " +
                (selectedEmailId === String(email._id)
                  ? "bg-orange-100 font-semibold"
                  : "")
              }
              onClick={() => setSelectedEmailId(String(email._id))}
              aria-selected={selectedEmailId === String(email._id)}
              tabIndex={0}
            >
              <div className="truncate">{email.subject}</div>
              <div className="truncate text-xs text-gray-500">
                {email.sender}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {getFormattedDate(email.receivedAt)}
              </div>
            </li>
          ))}
          {isLoading && (
            <li className="flex justify-center p-4">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            </li>
          )}
        </ul>
      )}
    </aside>
  );
};
