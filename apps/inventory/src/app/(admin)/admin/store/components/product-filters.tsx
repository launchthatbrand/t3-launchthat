"use client";

import React from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

export interface ProductFiltersProps {
  filters: {
    search: string;
    categoryId?: string;
    status?: string;
    priceMin?: number;
    priceMax?: number;
    isDigital?: boolean;
  };
  onChange: (filters: ProductFiltersProps["filters"]) => void;
  onReset: () => void;
}

export function ProductFilters({
  filters,
  onChange,
  onReset,
}: ProductFiltersProps) {
  // Fetch categories for the filter dropdown
  const categories =
    useQuery(api.ecommerce.categories.index.getProductCategories, {}) ?? [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (value: string) => {
    onChange({ ...filters, categoryId: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onChange({ ...filters, status: value || undefined });
  };

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? Number(e.target.value) : undefined;
    onChange({ ...filters, priceMin: value });
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? Number(e.target.value) : undefined;
    onChange({ ...filters, priceMax: value });
  };

  const handleDigitalChange = (checked: boolean) => {
    onChange({ ...filters, isDigital: checked });
  };

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search products..."
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={filters.categoryId || ""}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger id="category" className="mt-1">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={filters.status || ""} onValueChange={handleStatusChange}>
          <SelectTrigger id="status" className="mt-1">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="price-min">Min Price</Label>
          <Input
            id="price-min"
            type="number"
            min={0}
            step="0.01"
            value={filters.priceMin?.toString() || ""}
            onChange={handlePriceMinChange}
            placeholder="Min"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="price-max">Max Price</Label>
          <Input
            id="price-max"
            type="number"
            min={0}
            step="0.01"
            value={filters.priceMax?.toString() || ""}
            onChange={handlePriceMaxChange}
            placeholder="Max"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-digital"
          checked={filters.isDigital || false}
          onCheckedChange={handleDigitalChange}
        />
        <Label htmlFor="is-digital">Digital products only</Label>
      </div>

      <Button onClick={onReset} variant="outline" className="w-full">
        Reset Filters
      </Button>
    </div>
  );
}
