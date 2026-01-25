"use client";

import React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@acme/ui";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { Button } from "@acme/ui/button";

export type DiscordChannelOption = {
  id: string;
  name: string;
  type?: number;
  parentId?: string | null;
  position?: number | null;
};

export function DiscordChannelSelect(props: {
  value: string;
  onChange: (channelId: string) => void;
  options: DiscordChannelOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => {
    const id = String(props.value ?? "");
    if (!id) return null;
    return props.options.find((o) => o.id === id) ?? null;
  }, [props.options, props.value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          disabled={props.disabled}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : props.placeholder ?? "Select a channel"}
          </span>
          <ChevronDownIcon className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search channels..." />
          <CommandList>
            <CommandEmpty>No channels found.</CommandEmpty>
            <CommandGroup>
              {props.options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={`${opt.name} ${opt.id}`}
                  onSelect={() => {
                    props.onChange(opt.id);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{opt.name}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      opt.id === props.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

