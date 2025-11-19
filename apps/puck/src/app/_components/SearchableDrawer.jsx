// @ts-nocheck
import React, { Children, isValidElement, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@acme/puck-config/components/ui/input";
import { cn } from "@acme/puck-config/lib/utils";

/**
 * SearchableDrawer - Custom Puck drawer override with search functionality
 * Filters components by name, label, or category
 */
export const SearchableDrawer = ({ children, ...props }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Extract component information from children
  const componentData = useMemo(() => {
    const data = [];

    const extractFromChildren = (child) => {
      if (!isValidElement(child)) return;

      // Check if this is a category section
      if (child.props?.title) {
        const category = child.props.title;

        // Extract components from this category
        Children.forEach(child.props.children, (item) => {
          if (isValidElement(item) && item.props?.name) {
            data.push({
              element: item,
              name: item.props.name,
              label: item.props.label || item.props.name,
              category: category,
            });
          }
        });
      } else {
        // Recursively check children
        Children.forEach(child.props?.children, extractFromChildren);
      }
    };

    Children.forEach(children, extractFromChildren);
    return data;
  }, [children]);

  // Filter components based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase();
    return componentData.filter(
      (comp) =>
        comp.name.toLowerCase().includes(query) ||
        comp.label.toLowerCase().includes(query) ||
        comp.category.toLowerCase().includes(query),
    );
  }, [searchQuery, componentData]);

  // Group filtered results by category
  const groupedResults = useMemo(() => {
    if (!filteredData) return {};

    return filteredData.reduce((acc, comp) => {
      if (!acc[comp.category]) {
        acc[comp.category] = [];
      }
      acc[comp.category].push(comp);
      return acc;
    }, {});
  }, [filteredData]);

  const hasResults = filteredData && filteredData.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Search Header */}
      <div className="sticky top-0 z-10 mb-5 p-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-sm pl-9 pr-9"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search stats */}
        {isSearching && (
          <div className="mt-2 text-xs text-muted-foreground">
            {hasResults ? (
              <span>
                Found {filteredData.length} component
                {filteredData.length !== 1 ? "s" : ""}
              </span>
            ) : (
              <span>No components found</span>
            )}
          </div>
        )}
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          // Search results view
          <div className="p-2">
            {hasResults ? (
              Object.entries(groupedResults).map(([category, components]) => (
                <div key={category} className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {components.map((comp, idx) => (
                      <div key={`${comp.name}-${idx}`}>{comp.element}</div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="mb-2 text-muted-foreground">
                  <Search className="mx-auto h-8 w-8 opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No components match "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        ) : (
          // Default categorized view
          children
        )}
      </div>
    </div>
  );
};

/**
 * Enhanced DrawerItem - Highlights search matches
 */
export const SearchableDrawerItem = ({ children, name, label, ...props }) => {
  // You can add additional customization here if needed
  // For example, highlighting matched text
  return (
    <div data-component={name} className="relative">
      {children}
    </div>
  );
};
