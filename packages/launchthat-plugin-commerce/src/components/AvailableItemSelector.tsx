"use client";

import React from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";

interface AvailableItemSelectorProps<T> {
  title: string;
  items: T[];
  searchPlaceholder: string;
  label: (item: T) => string;
  onSelect: (item: T) => void | Promise<void>;
  newItemTrigger?: React.ReactNode; // optional button/dialog for creating new item
}

export function AvailableItemSelector<T>({
  title,
  items,
  searchPlaceholder,
  label,
  onSelect,
  newItemTrigger,
}: AvailableItemSelectorProps<T>) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">{title}</h4>
      <Command className="h-44 rounded-lg border shadow-md">
        <div className="flex flex-col items-center border-b p-1 md:flex-row">
          <CommandInput
            placeholder={searchPlaceholder}
            className="flex-1! border-none"
          />
          {newItemTrigger}
        </div>
        <CommandList>
          <CommandEmpty>
            No {typeof title === "string" ? title.toLowerCase() : "items"}{" "}
            found.
          </CommandEmpty>
          <CommandGroup>
            {items.map((item, idx) => (
              <CommandItem
                key={idx}
                value={label(item)}
                onSelect={() => onSelect(item)}
              >
                {label(item)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
