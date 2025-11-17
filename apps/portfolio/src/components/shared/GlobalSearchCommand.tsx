"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  Download,
  FileText,
  Image as ImageIcon,
  Search,
  ShoppingBag,
} from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";

// Define the props for the component
interface GlobalSearchCommandProps {
  displayMode?: "inline" | "dialog";
  className?: string;
  onResultSelect?: (result: SearchResult) => void;
  typeFilters?: string[]; // Array of content types to filter by (e.g., ["helpdesk", "post"])
  placeholder?: string; // Custom placeholder text
}

// Define a type for search results
interface SearchResult {
  _id: string;
  type: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  creatorName?: string;
  createdAt?: number;
  score?: number;
}

// Helper to get icon based on type
const getIconForType = (type: string) => {
  switch (type) {
    case "post":
      return <FileText className="h-5 w-5" />;
    case "event":
      return <CalendarDays className="h-5 w-5" />;
    case "download":
      return <Download className="h-5 w-5" />;
    case "product":
      return <ShoppingBag className="h-5 w-5" />;
    case "helpdesk":
      return <FileText className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

export function GlobalSearchCommand({
  displayMode = "dialog",
  className,
  onResultSelect,
  typeFilters,
  placeholder,
}: GlobalSearchCommandProps) {
  const [open, setOpen] = useState(displayMode === "inline"); // Dialog open state
  const [inputValue, setInputValue] = useState("");
  const [debouncedInputValue, setDebouncedInputValue] = useState("");
  const [mockResults, setMockResults] = useState<SearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null,
  );
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [navigationUrl, setNavigationUrl] = useState("");

  // Always call useQuery to follow React hooks rules, but use skip conditionally
  const convexResults = useQuery(
    api.search?.globalSearch ?? "skip",
    debouncedInputValue && api.search?.globalSearch
      ? {
          searchText: debouncedInputValue,
          limit: 10,
          ...(typeFilters?.length ? { typeFilters } : {}),
        }
      : "skip",
  );

  // Handle navigation effect
  useEffect(() => {
    if (shouldNavigate && navigationUrl) {
      window.location.href = navigationUrl;
      setShouldNavigate(false);
      setNavigationUrl("");
    }
  }, [shouldNavigate, navigationUrl]);

  // Update search results when convex results change
  useEffect(() => {
    if (Array.isArray(convexResults)) {
      setSearchResults(convexResults as SearchResult[]);
    }
  }, [convexResults]);

  // Generate a title for the search component based on filters
  const getSearchTitle = () => {
    if (!typeFilters?.length) return "Search";
    if (typeFilters.length === 1) return `Search ${typeFilters[0]} articles`;
    return `Search ${typeFilters.join(", ")}`;
  };

  // Debounce input value and generate mock results if needed
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInputValue(inputValue);

      // Generate mock results if search API is not available
      if (!api.search?.globalSearch && inputValue) {
        const allMockData: SearchResult[] = [
          {
            _id: "mock1",
            type: "post",
            title: `Mock post about "${inputValue}"`,
            description:
              "This is a mock result since the search API is not yet available.",
            url: "/social/post/mock1",
            imageUrl: "https://picsum.photos/seed/post1/200/200",
            creatorName: "John Doe",
            createdAt: Date.now() - 24 * 60 * 60 * 1000,
          },
          {
            _id: "mock2",
            type: "event",
            title: `Mock event: "${inputValue}" workshop`,
            description:
              "This is a mock result since the search API is not yet available.",
            url: "/calendar/event/mock2",
            imageUrl: "https://picsum.photos/seed/event2/200/200",
            creatorName: "Jane Smith",
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          },
          {
            _id: "mock3",
            type: "download",
            title: `Mock download: "${inputValue}" PDF`,
            description:
              "This is a mock result since the search API is not yet available.",
            url: "/downloads/mock3",
            imageUrl: "https://picsum.photos/seed/download3/200/200",
            creatorName: "Mike Johnson",
            createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          },
          {
            _id: "mock4",
            type: "product",
            title: `Mock product: "${inputValue}" premium package`,
            description:
              "This is a mock result since the search API is not yet available.",
            url: "/store/product/mock4",
            imageUrl: "https://picsum.photos/seed/product4/200/200",
            creatorName: "Sarah Williams",
            createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          },
          {
            _id: "mock5",
            type: "helpdesk",
            title: `Mock helpdesk article: "${inputValue}" guide`,
            description:
              "This is a mock helpdesk article since the search API is not yet available.",
            url: "/helpdesk/mock5",
            imageUrl: "https://picsum.photos/seed/helpdesk5/200/200",
            creatorName: "Support Team",
            createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
          },
        ];

        // Filter mock results if typeFilters is provided
        const filteredMockData = typeFilters?.length
          ? allMockData.filter((item) => typeFilters.includes(item.type))
          : allMockData;

        setMockResults(filteredMockData);
      }
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, typeFilters]);

  // Use either real results or mock results
  const results = searchResults ?? mockResults;

  // Handle selecting a search result
  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      if (onResultSelect) {
        onResultSelect(result);
      } else {
        // Navigate to result.url or handle selection as needed
        console.log("Selected result:", result.url);
        // Using an effect for navigation instead of direct assignment
        setNavigationUrl(result.url);
        setShouldNavigate(true);
      }

      setOpen(false);
      setInputValue(""); // Clear input after selection
    },
    [onResultSelect],
  );

  // Get the appropriate placeholder text
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (!typeFilters?.length)
      return "Search blog posts, events, downloads, products...";

    const typeNames = typeFilters.map((type) => {
      switch (type) {
        case "post":
          return "blog posts";
        case "event":
          return "events";
        case "download":
          return "downloads";
        case "product":
          return "products";
        case "helpdesk":
          return "help articles";
        default:
          return type;
      }
    });

    return `Search ${typeNames.join(", ")}...`;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const renderCommandContent = () => (
    <Command
      className={cn(
        "bg-background",
        displayMode === "inline" ? "rounded-lg border" : "",
      )}
    >
      <CommandInput
        placeholder={getPlaceholder()}
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList className="max-h-[70vh]">
        <CommandEmpty>
          {debouncedInputValue ? "No results found." : "Type to search..."}
        </CommandEmpty>
        {results && results.length > 0 && (
          <CommandGroup
            heading={
              api.search?.globalSearch
                ? "Results"
                : "Mock Results (API not available)"
            }
          >
            {results.map((result) => (
              <CommandItem
                key={`${result.type}-${result._id}`}
                value={`${result.title} ${result.description ?? ""} ${result.type}`}
                onSelect={() => handleSelectResult(result)}
                className="flex cursor-pointer flex-col items-start py-4"
              >
                <div className="flex w-full gap-4">
                  {/* Image or Icon Container */}
                  <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {result.imageUrl ? (
                      <Image
                        src={result.imageUrl}
                        alt={result.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-secondary/20">
                        {getIconForType(result.type)}
                      </div>
                    )}
                  </div>

                  {/* Content Container */}
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                        {result.type}
                      </div>
                      {result.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(result.createdAt)}
                        </span>
                      )}
                    </div>

                    <h3 className="truncate font-medium">{result.title}</h3>

                    {result.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {result.description}
                      </p>
                    )}

                    {result.creatorName && (
                      <span className="mt-1 text-xs text-muted-foreground">
                        By {result.creatorName}
                      </span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );

  if (displayMode === "inline") {
    return (
      <div className={cn("relative w-full", className)}>
        {renderCommandContent()}
      </div>
    );
  }

  // Dialog mode
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64",
            className,
          )}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>
            {typeFilters?.length ? `Search ${typeFilters[0]}...` : "Search..."}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 sm:max-w-[640px]">
        <DialogTitle className="sr-only">{getSearchTitle()}</DialogTitle>
        {renderCommandContent()}
      </DialogContent>
    </Dialog>
  );
}
