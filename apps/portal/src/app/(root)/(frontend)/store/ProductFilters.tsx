import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Search } from "lucide-react";
import { Slider } from "@acme/ui/slider";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";

interface CategoryWithChildren {
  _id: string;
  name: string;
  children: CategoryWithChildren[];
}

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onFilterChange?: (filters: ProductFilters) => void;
}

export interface ProductFilters {
  search: string;
  categoryId: string | null;
  status: string[];
  priceRange: [number, number];
  isDigital: boolean | null;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onCategoryChange,
  onFilterChange,
}: ProductFiltersProps) {
  // Get categories for filtering
  const categories = useQuery(api.ecommerce.getCategoryTree, {}) ?? [];

  // Filter states
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [isDigital, setIsDigital] = useState<boolean | null>(null);

  // Update filters when any value changes
  const updateFilters = (partial: Partial<ProductFilters>) => {
    const filters: ProductFilters = {
      search: searchQuery,
      categoryId: selectedCategoryId,
      status: statusFilters,
      priceRange,
      isDigital,
      ...partial,
    };

    onFilterChange?.(filters);
  };

  // Handle status filter changes
  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatusFilters = checked
      ? [...statusFilters, status]
      : statusFilters.filter((s) => s !== status);

    setStatusFilters(newStatusFilters);
    updateFilters({ status: newStatusFilters });
  };

  // Handle price range changes
  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
    updateFilters({ priceRange: value });
  };

  // Handle digital product filter
  const handleDigitalChange = (value: boolean | null) => {
    setIsDigital(value);
    updateFilters({ isDigital: value });
  };

  // Recursive function to render the category tree
  const renderCategoryTree = (
    categories: CategoryWithChildren[],
    level = 0,
  ) => {
    if (!categories || categories.length === 0) return null;

    return categories.map((category) => (
      <div key={category._id} className="mb-1">
        <div
          className={`cursor-pointer py-1 hover:bg-gray-100 ${
            selectedCategoryId === category._id ? "font-semibold" : ""
          } ${level > 0 ? `ml-${level * 2}` : ""}`}
          onClick={() =>
            onCategoryChange(
              selectedCategoryId === category._id ? null : category._id,
            )
          }
        >
          {category.name}
        </div>
        {category.children &&
          category.children.length > 0 &&
          renderCategoryTree(category.children, level + 1)}
      </div>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Categories */}
          <Accordion type="single" collapsible defaultValue="categories">
            <AccordionItem value="categories">
              <AccordionTrigger>Categories</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  <div
                    className={`cursor-pointer py-1 hover:bg-gray-100 ${
                      !selectedCategoryId ? "font-semibold" : ""
                    }`}
                    onClick={() => onCategoryChange(null)}
                  >
                    All Products
                  </div>
                  {renderCategoryTree(categories)}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Status filters */}
          <Accordion type="single" collapsible>
            <AccordionItem value="status">
              <AccordionTrigger>Status</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-active"
                      checked={statusFilters.includes("active")}
                      onCheckedChange={(checked) =>
                        handleStatusChange("active", checked === true)
                      }
                    />
                    <Label htmlFor="status-active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-draft"
                      checked={statusFilters.includes("draft")}
                      onCheckedChange={(checked) =>
                        handleStatusChange("draft", checked === true)
                      }
                    />
                    <Label htmlFor="status-draft">Draft</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-archived"
                      checked={statusFilters.includes("archived")}
                      onCheckedChange={(checked) =>
                        handleStatusChange("archived", checked === true)
                      }
                    />
                    <Label htmlFor="status-archived">Archived</Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Price range */}
          <Accordion type="single" collapsible>
            <AccordionItem value="price">
              <AccordionTrigger>Price Range</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <Slider
                    defaultValue={[0, 1000]}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={handlePriceChange}
                  />
                  <div className="flex justify-between">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Digital product filter */}
          <Accordion type="single" collapsible>
            <AccordionItem value="type">
              <AccordionTrigger>Product Type</AccordionTrigger>
              <AccordionContent>
                <Select
                  value={
                    isDigital === null ? "" : isDigital ? "digital" : "physical"
                  }
                  onValueChange={(value) => {
                    if (value === "") {
                      handleDigitalChange(null);
                    } else {
                      handleDigitalChange(value === "digital");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="digital">Digital only</SelectItem>
                      <SelectItem value="physical">Physical only</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Clear filters button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onSearchChange("");
              onCategoryChange(null);
              setStatusFilters([]);
              setPriceRange([0, 1000]);
              setIsDigital(null);
              updateFilters({
                search: "",
                categoryId: null,
                status: [],
                priceRange: [0, 1000],
                isDigital: null,
              });
            }}
          >
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
