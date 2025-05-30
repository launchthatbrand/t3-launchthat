"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  Download,
  FileText,
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
      return <FileText className="mr-2 h-4 w-4" />;
    case "event":
      return <CalendarDays className="mr-2 h-4 w-4" />;
    case "download":
      return <Download className="mr-2 h-4 w-4" />;
    case "product":
      return <ShoppingBag className="mr-2 h-4 w-4" />;
    case "helpdesk":
      return <FileText className="mr-2 h-4 w-4" />;
    default:
      return <FileText className="mr-2 h-4 w-4" />;
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

  // Safely check if search API exists
  const searchApi =
    api.search && "globalSearch" in api.search
      ? api.search.globalSearch
      : undefined;

  // Call useQuery unconditionally to follow React hooks rules
  const convexResults = useQuery(
    searchApi || "skip",
    debouncedInputValue && searchApi
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
      if (!searchApi && inputValue) {
        const allMockData: SearchResult[] = [
          {
            _id: "mock1",
            type: "post",
            title: `Mock post about "${inputValue}"`,
            description:
              "This is a mock result since the search API is not yet available.",
            url: "/social/post/mock1",
          },
          {
            _id: "mock2",
            type: "event",
            title: `Mock event: "${inputValue}" workshop`,
            description:
              "This is a mock result since the search API is not yet available.",
            url: "/calendar/event/mock2",
          },
          {
            _id: "mock3",
            type: "download",
            title: `Mock download: "${inputValue}" PDF`,
            description:
              "This is a mock result since the search API is not yet available.",
            url: "/downloads/mock3",
          },
          {
            _id: "mock4",
            type: "product",
            title: `Mock product: "${inputValue}" premium package`,
            description:
              "This is a mock result since the search API is not yet available.",
            url: "/store/product/mock4",
          },
          {
            _id: "mock5",
            type: "helpdesk",
            title: `Mock helpdesk article: "${inputValue}" guide`,
            description:
              "This is a mock helpdesk article since the search API is not yet available.",
            url: "/helpdesk/article/mock5",
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
  }, [inputValue, searchApi, typeFilters]);

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
      <CommandList>
        <CommandEmpty>
          {debouncedInputValue ? "No results found." : "Type to search..."}
        </CommandEmpty>
        {results?.length > 0 && (
          <CommandGroup
            heading={searchApi ? "Results" : "Mock Results (API not available)"}
          >
            {results.map((result) => (
              <CommandItem
                key={`${result.type}-${result._id}`}
                value={`${result.title} ${result.description ?? ""} ${result.type}`}
                onSelect={() => handleSelectResult(result)}
                className="cursor-pointer"
              >
                {getIconForType(result.type)}
                <span>{result.title}</span>
                {result.description && (
                  <span className="ml-2 truncate text-xs text-muted-foreground">
                    {result.description}
                  </span>
                )}
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
