"use client";

import { Check } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#000000",
];

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

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
                "focus:ring-ring h-8 w-8 rounded-full border focus:ring-2 focus:outline-none",
                value === color ? "ring-ring ring-2" : "",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              type="button"
            >
              {value === color && (
                <Check
                  className={cn(
                    "h-4 w-4",
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
