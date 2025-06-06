"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Hash } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@acme/ui/command";

import { api } from "../../../convex/_generated/api";
import { HashtagSuggestion as HashtagSuggestionType } from "../../utils/types";

interface HashtagSuggestionProps {
  query: string;
  onSelect: (hashtag: string) => void;
  position?: { top: number; left: number };
  visible: boolean;
  maxHeight?: number;
}

export function HashtagSuggestion({
  query,
  onSelect,
  position,
  visible,
  maxHeight = 200,
}: HashtagSuggestionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Query suggestions from API
  const suggestions = useQuery(
    api.socialfeed.queries.searchHashtags,
    visible && query.length > 0 ? { prefix: query, limit: 5 } : "skip",
  ) as HashtagSuggestionType[] | undefined;

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(0);
  }, [suggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!visible || !suggestions || suggestions.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((prevIndex) =>
            prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
          break;
        case "Enter":
          event.preventDefault();
          if (suggestions[activeIndex]) {
            onSelect(suggestions[activeIndex].tag);
          }
          break;
        case "Escape":
          // This would be handled by the parent component
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, suggestions, activeIndex, onSelect]);

  if (!visible || !suggestions || suggestions.length === 0) return null;

  // Calculate position
  const style = position
    ? {
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: `${maxHeight}px`,
      }
    : { maxHeight: `${maxHeight}px` };

  return (
    <div
      className="absolute z-50 w-64 overflow-hidden rounded-md border border-border bg-popover shadow-md"
      style={style}
    >
      <Command>
        <CommandList className="max-h-[inherit] overflow-auto">
          {suggestions.length === 0 ? (
            <CommandEmpty>No hashtags found</CommandEmpty>
          ) : (
            <CommandGroup heading="Trending Hashtags">
              {suggestions.map((hashtag, index) => (
                <CommandItem
                  key={hashtag._id}
                  className={`flex items-center gap-2 px-2 py-1.5 ${
                    index === activeIndex ? "bg-accent" : ""
                  }`}
                  onSelect={() => {
                    onSelect(hashtag.tag);
                  }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Hash className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">#{hashtag.tag}</p>
                    <p className="text-xs text-muted-foreground">
                      {hashtag.usageCount}{" "}
                      {hashtag.usageCount === 1 ? "post" : "posts"}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
