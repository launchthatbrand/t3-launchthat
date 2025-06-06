"use client";

import React from "react";
import { Check } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const PRESET_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Light Blue
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#64748b", // Slate
  "#000000", // Black
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex w-full items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-full border"
              style={{ backgroundColor: value }}
            />
            <span>{value}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={cn(
                "h-8 w-8 rounded-full border focus:outline-none focus:ring-2 focus:ring-ring",
                value === color ? "ring-2 ring-ring" : "",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            >
              {value === color && (
                <Check
                  className={cn(
                    "h-4 w-4",
                    // Use white check mark for dark colors
                    [
                      "#000000",
                      "#3b82f6",
                      "#6366f1",
                      "#8b5cf6",
                      "#a855f7",
                      "#d946ef",
                      "#f43f5e",
                    ].includes(color)
                      ? "text-white"
                      : "text-black",
                  )}
                />
              )}
              <span className="sr-only">Select color {color}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
