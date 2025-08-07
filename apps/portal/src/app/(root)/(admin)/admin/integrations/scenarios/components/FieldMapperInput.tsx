import { useMemo, useState } from "react";

import {
  Button,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@acme/ui";

export interface SourceFieldOption {
  label: string; // e.g. "Trigger1.title"
  value: string; // e.g. "{{trigger1.title}}"
}

interface FieldMapperInputProps {
  value?: string;
  onChange: (val: string) => void;
  sources: SourceFieldOption[];
  placeholder?: string;
}

export const FieldMapperInput = ({
  value,
  onChange,
  sources,
  placeholder,
}: FieldMapperInputProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (token: string) => {
    onChange(token);
    setOpen(false);
  };

  // Group sources by the prefix before the first dot (node label)
  const grouped = useMemo(() => {
    const map = new Map<string, SourceFieldOption[]>();
    sources.forEach((s) => {
      const [group] = s.label.split(".");
      const existing = map.get(group);
      if (existing) {
        existing.push(s);
      } else {
        map.set(group, [s]);
      }
    });
    return Array.from(map.entries()); // [ [group, options[]] ]
  }, [sources]);

  const defaultTabValue = grouped.length > 0 ? grouped[0][0] : "";

  return (
    <div className="relative flex w-full items-center gap-2">
      <Input
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon">
            +
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="end">
          {sources.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No data available
            </div>
          ) : (
            grouped.length > 0 && (
              <Tabs defaultValue={defaultTabValue} className="w-full">
                <TabsList className="grid grid-cols-3">
                  {grouped.map(([grp]) => (
                    <TabsTrigger key={grp} value={grp} className="truncate">
                      {grp}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {grouped.map(([grp, opts]) => (
                  <TabsContent
                    key={grp}
                    value={grp}
                    className="max-h-64 overflow-y-auto p-2"
                  >
                    <Command>
                      <CommandInput placeholder="Search fields..." />
                      <CommandList>
                        <CommandEmpty>No results.</CommandEmpty>
                        {opts.map((s) => (
                          <CommandItem
                            key={s.value}
                            value={s.label}
                            onSelect={() => handleSelect(s.value)}
                          >
                            {s.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </TabsContent>
                ))}
              </Tabs>
            )
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
