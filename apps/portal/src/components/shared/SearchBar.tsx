"use client";

import { useCallback, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  initialValue?: string;
}

export function SearchBar({
  placeholder = "Search...",
  onSearch,
  className = "",
  initialValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch?.("");
  }, [onSearch]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.(query);
    },
    [query, onSearch],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex w-full items-center ${className}`}
    >
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className="w-full rounded-full border bg-background py-2 pl-10 pr-12"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    </form>
  );
}
