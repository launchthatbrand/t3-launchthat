"use client";

import type { DateRange as DayPickerDateRange } from "react-day-picker";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookmarkPlus,
  CalendarDays,
  Filter,
  SortAsc,
  SortDesc,
  Star,
  X,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import { Input } from "@acme/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { FilterValue } from "../shared/EntityList/types";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface FeedFiltersProps {
  onFiltersChange?: (filters: Record<string, FilterValue>) => void;
  className?: string;
}

// Extend FilterValue type to include Date
type ExtendedFilterValue = FilterValue | Date;

// Extended filter record type that allows for date properties
interface ExtendedFilters {
  contentType: string;
  source: string;
  author: string;
  sort: string;
  dateRange: string;
  fromDate?: Date;
  toDate?: Date;
  [key: string]: ExtendedFilterValue | undefined;
}

// Content type filter options
const contentTypeOptions = [
  { label: "All", value: "all" },
  { label: "Posts", value: "post" },
  { label: "Shares", value: "share" },
  { label: "Media", value: "media" },
  { label: "Comments", value: "comment" },
];

// Source (module) filter options
const sourceOptions = [
  { label: "All", value: "all" },
  { label: "Blog", value: "blog" },
  { label: "Courses", value: "course" },
  { label: "Groups", value: "group" },
  { label: "Events", value: "event" },
];

// Author filter options
const authorOptions = [
  { label: "All", value: "all" },
  { label: "Following", value: "following" },
  { label: "My Network", value: "network" },
];

// Sort options
const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Most Popular", value: "popular" },
  { label: "Most Relevant", value: "relevant" },
];

function FeedFiltersInner({
  onFiltersChange,
  className = "",
}: FeedFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active filters state
  const [activeFilters, setActiveFilters] = useState<ExtendedFilters>({
    contentType: searchParams.get("contentType") ?? "all",
    source: searchParams.get("source") ?? "all",
    author: searchParams.get("author") ?? "all",
    sort: searchParams.get("sort") ?? "newest",
    dateRange: "all",
  });

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Tracks visible filter chips
  const [visibleFilters, setVisibleFilters] = useState<string[]>([]);

  // Save filter preset
  const [savedPresets, setSavedPresets] = useState<
    {
      name: string;
      filters: ExtendedFilters;
    }[]
  >([]);
  const [presetName, setPresetName] = useState<string>("");

  // Initialize visible filters from URL params on mount
  useEffect(() => {
    const visibleFilterIds: string[] = [];

    // Check each filter type in the URL
    if (
      searchParams.get("contentType") &&
      searchParams.get("contentType") !== "all"
    ) {
      visibleFilterIds.push("contentType");
    }
    if (searchParams.get("source") && searchParams.get("source") !== "all") {
      visibleFilterIds.push("source");
    }
    if (searchParams.get("author") && searchParams.get("author") !== "all") {
      visibleFilterIds.push("author");
    }
    if (searchParams.get("sort") && searchParams.get("sort") !== "newest") {
      visibleFilterIds.push("sort");
    }

    // Check date range filters
    if (searchParams.get("fromDate") && searchParams.get("toDate")) {
      visibleFilterIds.push("dateRange");

      // Set date range if dates are in URL
      try {
        const fromDateStr = searchParams.get("fromDate");
        const toDateStr = searchParams.get("toDate");

        if (fromDateStr && toDateStr) {
          const fromDate = new Date(fromDateStr);
          const toDate = new Date(toDateStr);
          setDateRange({ from: fromDate, to: toDate });
        }
      } catch (error) {
        console.error("Error parsing date range from URL", error);
      }
    }

    setVisibleFilters(visibleFilterIds);
  }, [searchParams]);

  // Handle filter changes and update URL
  const handleFilterChange = useCallback(
    (filterId: string, value: FilterValue) => {
      const newFilters = { ...activeFilters, [filterId]: value };

      // Update URL parameters
      const params = new URLSearchParams(searchParams);
      if (value === "all" || value === null) {
        params.delete(filterId);
      } else {
        params.set(filterId, String(value));
      }

      // Update router
      router.push(`${pathname}?${params.toString()}`);

      // Update local state
      setActiveFilters(newFilters);

      // Add to visible filters if not "all" and not already included
      if (
        value !== "all" &&
        value !== null &&
        !visibleFilters.includes(filterId)
      ) {
        setVisibleFilters([...visibleFilters, filterId]);
      } else if (
        (value === "all" || value === null) &&
        visibleFilters.includes(filterId)
      ) {
        setVisibleFilters(visibleFilters.filter((f) => f !== filterId));
      }

      // Notify parent component
      if (onFiltersChange) {
        onFiltersChange(newFilters as Record<string, FilterValue>);
      }
    },
    [
      activeFilters,
      onFiltersChange,
      pathname,
      router,
      searchParams,
      visibleFilters,
    ],
  );

  // Handle date range selection
  const handleDateRangeChange = useCallback(
    (range: DayPickerDateRange | undefined) => {
      const updatedRange: DateRange = {
        from: range?.from,
        to: range?.to,
      };
      setDateRange(updatedRange);

      // Only set the filter when we have a complete range
      if (updatedRange.from && updatedRange.to) {
        const params = new URLSearchParams(searchParams);
        params.set("fromDate", updatedRange.from.toISOString());
        params.set("toDate", updatedRange.to.toISOString());

        router.push(`${pathname}?${params.toString()}`);

        // Update active filters and visible filters
        const newFilters: ExtendedFilters = {
          ...activeFilters,
          dateRange: "custom",
          fromDate: updatedRange.from,
          toDate: updatedRange.to,
        };

        setActiveFilters(newFilters);

        if (!visibleFilters.includes("dateRange")) {
          setVisibleFilters([...visibleFilters, "dateRange"]);
        }

        // Notify parent component
        if (onFiltersChange) {
          // Convert Date objects to strings for compatibility with FilterValue
          const compatibleFilters: Record<string, FilterValue> = {
            ...activeFilters,
            dateRange: "custom",
            fromDate: updatedRange.from.toISOString() as FilterValue,
            toDate: updatedRange.to.toISOString() as FilterValue,
          };
          onFiltersChange(compatibleFilters);
        }
      }
    },
    [
      activeFilters,
      onFiltersChange,
      pathname,
      router,
      searchParams,
      visibleFilters,
    ],
  );

  // Handle preset date ranges
  const handlePresetDateRange = useCallback(
    (preset: string) => {
      const now = new Date();
      let from: Date | undefined;
      let to: Date | undefined = now;

      switch (preset) {
        case "today":
          from = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "yesterday":
          from = new Date(now);
          from.setDate(from.getDate() - 1);
          from.setHours(0, 0, 0, 0);
          to = new Date(now);
          to.setDate(to.getDate() - 1);
          to.setHours(23, 59, 59, 999);
          break;
        case "week":
          from = new Date(now);
          from.setDate(from.getDate() - 7);
          break;
        case "month":
          from = new Date(now);
          from.setMonth(from.getMonth() - 1);
          break;
        case "year":
          from = new Date(now);
          from.setFullYear(from.getFullYear() - 1);
          break;
        default:
          from = undefined;
          to = undefined;
          break;
      }

      setDateRange({ from, to });

      if (preset === "all") {
        const params = new URLSearchParams(searchParams);
        params.delete("fromDate");
        params.delete("toDate");
        router.push(`${pathname}?${params.toString()}`);

        const newFilters: ExtendedFilters = {
          ...activeFilters,
          dateRange: "all",
        };
        // Remove date properties instead of using delete
        const { fromDate: _, toDate: __, ...cleanFilters } = newFilters;

        setActiveFilters({ ...cleanFilters, dateRange: "all" });
        setVisibleFilters(visibleFilters.filter((f) => f !== "dateRange"));

        if (onFiltersChange) {
          onFiltersChange({ ...cleanFilters, dateRange: "all" } as Record<
            string,
            FilterValue
          >);
        }
      } else if (from && to) {
        const params = new URLSearchParams(searchParams);
        params.set("fromDate", from.toISOString());
        params.set("toDate", to.toISOString());
        router.push(`${pathname}?${params.toString()}`);

        const newFilters: ExtendedFilters = {
          ...activeFilters,
          dateRange: preset,
          fromDate: from,
          toDate: to,
        };

        setActiveFilters(newFilters);

        if (!visibleFilters.includes("dateRange")) {
          setVisibleFilters([...visibleFilters, "dateRange"]);
        }

        if (onFiltersChange) {
          // Convert Date objects to strings for compatibility
          const compatibleFilters: Record<string, FilterValue> = {
            ...activeFilters,
            dateRange: preset,
            fromDate: from.toISOString() as FilterValue,
            toDate: to.toISOString() as FilterValue,
          };
          onFiltersChange(compatibleFilters);
        }
      }
    },
    [
      activeFilters,
      onFiltersChange,
      pathname,
      router,
      searchParams,
      visibleFilters,
    ],
  );

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    // Reset to default values
    setActiveFilters({
      contentType: "all",
      source: "all",
      author: "all",
      sort: "newest",
      dateRange: "all",
    });
    setDateRange({ from: undefined, to: undefined });
    setVisibleFilters([]);

    // Clear URL parameters
    router.push(pathname);

    // Notify parent component
    if (onFiltersChange) {
      onFiltersChange({
        contentType: "all",
        source: "all",
        author: "all",
        sort: "newest",
        dateRange: "all",
      });
    }
  }, [onFiltersChange, pathname, router]);

  // Remove a single filter
  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      // Reset this filter to default
      let defaultValue = "all";
      if (filterId === "sort") defaultValue = "newest";

      const newFilters = { ...activeFilters, [filterId]: defaultValue };

      // Update URL parameters
      const params = new URLSearchParams(searchParams);
      params.delete(filterId);
      if (filterId === "dateRange") {
        params.delete("fromDate");
        params.delete("toDate");

        // Remove date properties cleanly
        const { fromDate: _, toDate: __, ...cleanFilters } = newFilters;
        setActiveFilters({ ...cleanFilters, [filterId]: defaultValue });

        if (onFiltersChange) {
          onFiltersChange({
            ...cleanFilters,
            [filterId]: defaultValue,
          } as Record<string, FilterValue>);
        }
      } else {
        setActiveFilters(newFilters);

        if (onFiltersChange) {
          onFiltersChange(newFilters as Record<string, FilterValue>);
        }
      }

      router.push(`${pathname}?${params.toString()}`);
      setVisibleFilters(visibleFilters.filter((f) => f !== filterId));

      // Reset date range if that's the filter being removed
      if (filterId === "dateRange") {
        setDateRange({ from: undefined, to: undefined });
      }
    },
    [
      activeFilters,
      onFiltersChange,
      pathname,
      router,
      searchParams,
      visibleFilters,
    ],
  );

  // Get filter label for display in chips
  const getFilterLabel = useCallback(
    (filterId: string, value: FilterValue | undefined): string => {
      if (value === undefined) return "";

      switch (filterId) {
        case "contentType":
          return (
            contentTypeOptions.find((opt) => opt.value === value)?.label ??
            String(value)
          );
        case "source":
          return (
            sourceOptions.find((opt) => opt.value === value)?.label ??
            String(value)
          );
        case "author":
          return (
            authorOptions.find((opt) => opt.value === value)?.label ??
            String(value)
          );
        case "sort":
          return (
            sortOptions.find((opt) => opt.value === value)?.label ??
            String(value)
          );
        case "dateRange":
          if (value === "custom" && dateRange.from && dateRange.to) {
            return `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`;
          }
          switch (value) {
            case "today":
              return "Today";
            case "yesterday":
              return "Yesterday";
            case "week":
              return "Last 7 days";
            case "month":
              return "Last 30 days";
            case "year":
              return "Last year";
            default:
              return "Custom date range";
          }
        default:
          return String(value);
      }
    },
    [dateRange],
  );

  // Handle saving current filter preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;

    setSavedPresets([
      ...savedPresets,
      { name: presetName, filters: { ...activeFilters } },
    ]);
    setPresetName("");
  }, [presetName, activeFilters, savedPresets]);

  // Load a saved preset
  const handleLoadPreset = useCallback(
    (preset: { name: string; filters: ExtendedFilters }) => {
      // Update URL parameters
      const params = new URLSearchParams();

      // Add each filter to the URL params
      Object.entries(preset.filters).forEach(([key, value]) => {
        if (key === "fromDate" || key === "toDate") {
          if (value instanceof Date) {
            params.set(key, value.toISOString());
          }
        } else if (value !== "all" && value !== null && value !== undefined) {
          params.set(key, String(value));
        }
      });

      // Update router
      router.push(`${pathname}?${params.toString()}`);

      // Update state
      setActiveFilters(preset.filters);

      // Update visible filters
      const newVisibleFilters = Object.entries(preset.filters)
        .filter(
          ([key, value]) =>
            value !== "all" &&
            value !== null &&
            value !== undefined &&
            key !== "fromDate" &&
            key !== "toDate",
        )
        .map(([key]) => key);

      if (preset.filters.fromDate && preset.filters.toDate) {
        if (!newVisibleFilters.includes("dateRange")) {
          newVisibleFilters.push("dateRange");
        }
      }

      setVisibleFilters(newVisibleFilters);

      // Update date range
      setDateRange({
        from: preset.filters.fromDate,
        to: preset.filters.toDate,
      });

      // Notify parent component
      if (onFiltersChange) {
        // Convert Date objects to strings for compatibility
        const compatibleFilters: Record<string, FilterValue> = {};

        Object.entries(preset.filters).forEach(([key, value]) => {
          if (value instanceof Date) {
            compatibleFilters[key] = value.toISOString() as FilterValue;
          } else if (value !== undefined) {
            compatibleFilters[key] = value as FilterValue;
          }
        });

        onFiltersChange(compatibleFilters);
      }
    },
    [onFiltersChange, pathname, router],
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="source">Source</TabsTrigger>
                <TabsTrigger value="author">Author</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="p-4 pt-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Content Type</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {contentTypeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={
                          activeFilters.contentType === option.value
                            ? "primary"
                            : "outline"
                        }
                        size="sm"
                        className="justify-start"
                        onClick={() =>
                          handleFilterChange("contentType", option.value)
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="source" className="p-4 pt-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Content Source</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {sourceOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={
                          activeFilters.source === option.value
                            ? "primary"
                            : "outline"
                        }
                        size="sm"
                        className="justify-start"
                        onClick={() =>
                          handleFilterChange("source", option.value)
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="author" className="p-4 pt-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Authors</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {authorOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={
                          activeFilters.author === option.value
                            ? "primary"
                            : "outline"
                        }
                        size="sm"
                        className="justify-start"
                        onClick={() =>
                          handleFilterChange("author", option.value)
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 border-r p-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Quick Select</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={
                        activeFilters.dateRange === "all"
                          ? "primary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handlePresetDateRange("all")}
                    >
                      All Time
                    </Button>
                    <Button
                      variant={
                        activeFilters.dateRange === "today"
                          ? "primary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handlePresetDateRange("today")}
                    >
                      Today
                    </Button>
                    <Button
                      variant={
                        activeFilters.dateRange === "yesterday"
                          ? "primary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handlePresetDateRange("yesterday")}
                    >
                      Yesterday
                    </Button>
                    <Button
                      variant={
                        activeFilters.dateRange === "week"
                          ? "primary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handlePresetDateRange("week")}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant={
                        activeFilters.dateRange === "month"
                          ? "primary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handlePresetDateRange("month")}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant={
                        activeFilters.dateRange === "year"
                          ? "primary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handlePresetDateRange("year")}
                    >
                      Last year
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.from ?? undefined,
                    to: dateRange.to ?? undefined,
                  }}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={1}
                  initialFocus
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Selector */}
        <Select
          value={String(activeFilters.sort)}
          onValueChange={(value) => handleFilterChange("sort", value)}
        >
          <SelectTrigger className="h-8 w-auto gap-1">
            {activeFilters.sort === "newest" ? (
              <SortDesc className="h-3.5 w-3.5" />
            ) : (
              <SortAsc className="h-3.5 w-3.5" />
            )}
            <span>Sort: {getFilterLabel("sort", activeFilters.sort)}</span>
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Save Preset Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save Preset</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-4" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Save Current Filters</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <Button
                  className="w-full"
                  disabled={!presetName.trim()}
                  onClick={handleSavePreset}
                >
                  Save Preset
                </Button>
              </div>

              {savedPresets.length > 0 && (
                <>
                  <Separator />
                  <h4 className="font-medium">Saved Presets</h4>
                  <div className="max-h-[200px] space-y-2 overflow-auto">
                    {savedPresets.map((preset, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-full justify-start text-left"
                          onClick={() => handleLoadPreset(preset)}
                        >
                          <Star className="mr-2 h-3.5 w-3.5" />
                          {preset.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setSavedPresets(
                              savedPresets.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters Display */}
        {visibleFilters.length > 0 && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <div className="flex flex-wrap gap-2">
              {visibleFilters.map((filterId) => (
                <Badge key={filterId} variant="secondary" className="gap-1">
                  <span>
                    {filterId === "dateRange"
                      ? "Date"
                      : getFilterLabel(filterId, activeFilters[filterId])}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-3 w-3 rounded-full p-0"
                    onClick={() => handleRemoveFilter(filterId)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {filterId} filter</span>
                  </Button>
                </Badge>
              ))}

              {visibleFilters.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleClearAllFilters}
                >
                  Clear all
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Responsive hints for small screens */}
      <div className="block text-xs text-muted-foreground md:hidden">
        <p>Swipe horizontally to see more filter options</p>
      </div>
    </div>
  );
}

export function FeedFilters(props: FeedFiltersProps) {
  return (
    <Suspense fallback={<div className={props.className}>Loading filters…</div>}>
      <FeedFiltersInner {...props} />
    </Suspense>
  );
}
