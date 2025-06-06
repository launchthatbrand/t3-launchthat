"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { Search } from "lucide-react";

import {
  TransformationCategory,
  TransformationItem,
  TransformationSelectorProps,
} from "./types";

/**
 * A draggable transformation function component
 */
const DraggableTransformation: React.FC<{
  transformation: TransformationItem;
  onClick?: () => void;
}> = ({ transformation, onClick }) => {
  // Set up draggable with dnd-kit
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `transformation-${transformation.id}`,
      data: {
        transformation,
        type: "transformation",
      },
    });

  // Create style for the draggable element
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Define color based on category
  const getCategoryColor = (category: TransformationCategory) => {
    const colorMap: Record<TransformationCategory, string> = {
      [TransformationCategory.String]: "bg-blue-50 border-blue-200",
      [TransformationCategory.Number]: "bg-purple-50 border-purple-200",
      [TransformationCategory.Date]: "bg-amber-50 border-amber-200",
      [TransformationCategory.Logic]: "bg-green-50 border-green-200",
      [TransformationCategory.Array]: "bg-indigo-50 border-indigo-200",
      [TransformationCategory.Object]: "bg-teal-50 border-teal-200",
      [TransformationCategory.Conversion]: "bg-pink-50 border-pink-200",
      [TransformationCategory.Advanced]: "bg-gray-50 border-gray-200",
      [TransformationCategory.Json]: "bg-rose-50 border-rose-200",
      [TransformationCategory.Custom]: "bg-orange-50 border-orange-200",
    };

    return colorMap[category] || "bg-gray-50 border-gray-200";
  };

  const categoryColor = getCategoryColor(transformation.category);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative rounded border p-3 shadow-sm transition-colors hover:shadow-md ${categoryColor} ${
        isDragging ? "z-50 shadow-lg ring-2 ring-blue-400" : ""
      }`}
      onClick={onClick}
    >
      <div className="absolute right-2 top-2 text-gray-400 opacity-50 group-hover:opacity-100">
        <DragHandleDots2Icon className="h-4 w-4" />
      </div>
      <h4 className="font-medium">{transformation.name}</h4>
      <p className="mt-1 text-xs text-gray-500">{transformation.description}</p>
      <div className="mt-2 rounded bg-white/60 p-2 text-xs">
        <div>
          <strong>Input:</strong> {transformation.inputTypes.join(", ")}
        </div>
        <div>
          <strong>Output:</strong> {transformation.outputType}
        </div>
        {transformation.parameters.length > 0 && (
          <div>
            <strong>Parameters:</strong>{" "}
            {transformation.parameters.map((p) => p.name).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Component for browsing and selecting transformation functions.
 * Shows categories and functions with search functionality.
 */
const TransformationSelector: React.FC<TransformationSelectorProps> = ({
  transformations,
  selectedCategory,
  onCategoryChange,
  onTransformationSelect,
  compatibleWith,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter transformations based on search term and selected category
  const filteredTransformations = transformations.filter((transformation) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === "" ||
      transformation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformation.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Filter by category
    const matchesCategory =
      selectedCategory === "all" ||
      transformation.category === selectedCategory;

    // Filter by compatibility
    const isCompatible =
      !compatibleWith || transformation.inputTypes.includes(compatibleWith);

    return matchesSearch && matchesCategory && isCompatible;
  });

  // Get unique categories from transformations
  const categories = Object.values(TransformationCategory);

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transformations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Category tabs */}
        <div className="col-span-2 flex flex-col gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="justify-start"
            onClick={() => onCategoryChange("all")}
          >
            All Categories
          </Button>

          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="justify-start"
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Transformation functions grid */}
        <div className="col-span-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredTransformations.length > 0 ? (
            filteredTransformations.map((transformation) => (
              <DraggableTransformation
                key={transformation.id}
                transformation={transformation}
                onClick={() => onTransformationSelect(transformation)}
              />
            ))
          ) : (
            <div className="col-span-full p-6 text-center text-gray-500">
              No transformations found matching your criteria
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-2 font-medium">How to use transformations</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              1
            </span>
            <span>
              Drag a transformation function onto a mapping to apply it
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              2
            </span>
            <span>
              Configure parameters for the transformation in the mapping card
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              3
            </span>
            <span>
              Click on a transformation to see examples and detailed information
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TransformationSelector;
