"use client";

import {
  Card,
  CardContent,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Skeleton,
} from "@acme/ui";
import { useEffect, useState } from "react";

import { ContactCard } from "./ContactCard";
import { EmptyState } from "@acme/ui/entity-list/EmptyState";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

interface ContactListProps {
  userId: string | undefined;
  search?: string;
  tags?: string[];
  customerType?: string | null;
  isAdmin?: boolean;
}

// Function to render list content to avoid conditional hook calls
const ContactListContent = ({
  userId,
  search,
  tags,
  customerType,
  isAdmin = false,
}: {
  userId: string;
  search: string;
  tags: string[];
  customerType: string | null;
  isAdmin?: boolean;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [paginationCache, setPaginationCache] = useState<
    Record<number, string | null>
  >({
    1: null, // First page has null cursor
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setCursor(null);
  }, [search, tags, customerType]);

  // Prepare filters object
  const filters: {
    tags?: string[];
    customerType?:
      | "lead"
      | "prospect"
      | "customer"
      | "former-customer"
      | "partner";
  } = {};

  if (tags.length > 0) {
    filters.tags = tags;
  }

  if (customerType) {
    // Type assertion to ensure customerType matches the expected union type
    filters.customerType = customerType as
      | "lead"
      | "prospect"
      | "customer"
      | "former-customer"
      | "partner";
  }

  // Fetch contacts with pagination
  const queryResult = useQuery(api.core.crm.contacts.queries.getContacts, {
    userId,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    paginationOpts: {
      numItems: 10,
      cursor,
    },
    search: search.length > 0 ? search : undefined,
  });

  // Update pagination state when results come in
  useEffect(() => {
    if (queryResult) {
      setHasNextPage(!!queryResult.hasMore);

      // Cache the cursor for the next page
      if (queryResult.continueCursor) {
        setPaginationCache((prev) => ({
          ...prev,
          [currentPage + 1]: queryResult.continueCursor,
        }));
      }
    }
  }, [queryResult, currentPage]);

  const handlePageChange = (page: number) => {
    // Use cached cursor if available
    const newCursor = paginationCache[page] ?? null;
    setCursor(newCursor);
    setCurrentPage(page);
  };

  // Loading state
  if (queryResult === undefined) {
    return (
      <Card className={isAdmin ? "" : "border shadow"}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No results
  if (queryResult.contacts.length === 0) {
    return <EmptyState type="contacts" isAdmin={isAdmin} />;
  }

  return (
    <div className="space-y-4">
      {queryResult.contacts.map((contact) => (
        <ContactCard key={contact._id} contact={contact} isAdmin={isAdmin} />
      ))}

      {/* Custom pagination implementation */}
      <div className="mt-6 flex justify-center">
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                />
              </PaginationItem>
            )}

            {Array.from({
              length: hasNextPage ? currentPage + 1 : currentPage,
            }).map((_, i) => {
              const page = i + 1;
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {hasNextPage && (
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

// Main component that conditionally renders based on userId
export const ContactList = ({
  userId,
  search = "",
  tags = [],
  customerType = null,
  isAdmin = false,
}: ContactListProps) => {
  // If userId is undefined, show empty state
  if (!userId) {
    return <EmptyState type="contacts" isAdmin={isAdmin} />;
  }

  // Otherwise, render the list content
  return (
    <ContactListContent
      userId={userId}
      search={search}
      tags={tags}
      customerType={customerType}
      isAdmin={isAdmin}
    />
  );
};
