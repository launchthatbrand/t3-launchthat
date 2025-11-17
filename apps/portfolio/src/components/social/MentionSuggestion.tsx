"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@acme/ui/command";

import { api } from "../../../convex/_generated/api";
import { UserSuggestion } from "../../utils/types";

interface MentionSuggestionProps {
  query: string;
  onSelect: (user: { username: string; name: string; id: string }) => void;
  position?: { top: number; left: number };
  visible: boolean;
  maxHeight?: number;
}

export function MentionSuggestion({
  query,
  onSelect,
  position,
  visible,
  maxHeight = 200,
}: MentionSuggestionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Query suggestions from API
  const suggestions = useQuery(
    api.socialfeed.queries.getUserSuggestions,
    visible && query.length > 0 ? { query, limit: 5 } : "skip",
  ) as UserSuggestion[] | undefined;

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
            const selected = suggestions[activeIndex];
            onSelect({
              username: selected.username,
              name: selected.name,
              id: selected._id,
            });
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
            <CommandEmpty>No users found</CommandEmpty>
          ) : (
            <CommandGroup heading="Suggestions">
              {suggestions.map((user, index) => (
                <CommandItem
                  key={user._id}
                  className={`flex items-center gap-2 px-2 py-1.5 ${
                    index === activeIndex ? "bg-accent" : ""
                  }`}
                  onSelect={() => {
                    onSelect({
                      username: user.username,
                      name: user.name,
                      id: user._id,
                    });
                  }}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
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
