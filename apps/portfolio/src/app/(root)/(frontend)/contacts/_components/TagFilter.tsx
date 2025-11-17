"use client";

import { useMemo } from "react";
import { CheckIcon, Tag } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui";

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export const TagFilter = ({ tags, selectedTags, onChange }: TagFilterProps) => {
  // Get unique tags
  const uniqueTags = useMemo(() => {
    return Array.from(new Set(tags));
  }, [tags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4" />
          Filter by Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedTags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
        <Command className="rounded-md border">
          <CommandInput placeholder="Search tags..." />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {uniqueTags.map((tag) => (
                <CommandItem
                  key={tag}
                  value={tag}
                  onSelect={() => toggleTag(tag)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-1 items-center gap-2">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                        selectedTags.includes(tag)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedTags.includes(tag) && (
                        <CheckIcon className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    {tag}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CardContent>
    </Card>
  );
};
