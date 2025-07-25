"use client";

import { LayoutGrid, List } from "lucide-react";

import { Button } from "@acme/ui/button";

import type { EntityListHeaderProps } from "./types";
import { Search } from "./Search";

export function EntityListHeader({
  title,
  description,
  searchTerm,
  onSearchChange,
  viewMode,
  viewModes,
  onViewModeChange,
  actions,
  isSearching,
  enableSearch,
}: EntityListHeaderProps) {
  console.log("[EntityListHeader] viewModes", viewModes);
  return (
    <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        {title && <h2 className="text-xl font-bold tracking-tight">{title}</h2>}
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0 md:items-center">
        {enableSearch && (
          <Search
            value={searchTerm}
            onChange={onSearchChange}
            isSearching={isSearching}
            placeholder="Search..."
            className="max-w-xs"
          />
        )}

        {viewModes.length >= 1 && (
          <div className="flex rounded-md border">
            {viewModes.includes("list") && (
              <Button
                variant={viewMode === "list" ? "primary" : "ghost"}
                size="sm"
                className="rounded-none rounded-l-md"
                onClick={() => onViewModeChange("list")}
              >
                <List className="h-4 w-4" />
                <span className="sr-only">List view</span>
              </Button>
            )}
            {viewModes.includes("grid") && (
              <Button
                variant={viewMode === "grid" ? "primary" : "ghost"}
                size="sm"
                className="rounded-none rounded-r-md"
                onClick={() => onViewModeChange("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
              </Button>
            )}
          </div>
        )}

        {actions && (
          <div className="flex items-center space-x-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
