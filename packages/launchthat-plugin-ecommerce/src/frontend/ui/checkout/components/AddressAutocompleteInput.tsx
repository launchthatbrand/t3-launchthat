"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import { Input } from "@acme/ui/input";
import { cn } from "@acme/ui/lib/utils";
import { Popover, PopoverAnchor, PopoverContent } from "@acme/ui/popover";
import { Loader2 } from "lucide-react";

export type GeoapifySuggestion = {
  formatted: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  countryCode: string; // ISO alpha2
};

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const normalizeCountryCode = (value: string | undefined): string | null => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toLowerCase();
  return null;
};

export function AddressAutocompleteInput(props: {
  id?: string;
  value: string;
  onValueChange: (next: string) => void;
  onSelectSuggestion: (s: GeoapifySuggestion) => void;
  disabled?: boolean;
  placeholder?: string;
  countryCode?: string;
  className?: string;
}) {
  const {
    id,
    value,
    onValueChange,
    onSelectSuggestion,
    disabled,
    placeholder,
    countryCode,
    className,
  } = props;

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<Array<GeoapifySuggestion>>([]);
  const [query, setQuery] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const effectiveQuery = useMemo(() => {
    const v = (query || value || "").trim();
    return v;
  }, [query, value]);

  useEffect(() => {
    if (disabled) return;
    const q = effectiveQuery.trim();
    if (q.length < 3) {
      setItems([]);
      setIsLoading(false);
      setOpen(q.length > 0);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setOpen(true);

      const url = new URL("/api/geoapify/autocomplete", window.location.origin);
      url.searchParams.set("text", q);
      url.searchParams.set("limit", "8");
      const cc = normalizeCountryCode(countryCode);
      if (cc) url.searchParams.set("countryCode", cc);

      void fetch(url.toString(), { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) return null;
          return (await res.json().catch(() => null)) as any;
        })
        .then((json) => {
          const features = Array.isArray(json?.features)
            ? (json.features as any[])
            : [];
          const next: Array<GeoapifySuggestion> = features
            .map((f) => {
              const p = f?.properties ?? {};
              const formatted =
                asString(p.formatted) || asString(p.address_line1);
              const address1 = asString(p.address_line1);
              const address2 = asString(p.address_line2);
              const city =
                asString(p.city) ||
                asString(p.town) ||
                asString(p.village) ||
                asString(p.suburb);
              const state = asString(p.state_code) || asString(p.state);
              const postcode = asString(p.postcode);
              const cc = asString(p.country_code).toUpperCase();

              if (!formatted || !address1) return null;
              return {
                formatted,
                address1,
                address2,
                city,
                state,
                postcode,
                countryCode: cc,
              } satisfies GeoapifySuggestion;
            })
            .filter(Boolean) as Array<GeoapifySuggestion>;

          setItems(next);
          setOpen(true);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setItems([]);
          setOpen(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 220);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [countryCode, disabled, effectiveQuery]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor asChild>
        <div className={cn("w-full", className)}>
          <Input
            id={id}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              onValueChange(next);
              if (!disabled) setOpen(next.trim().length > 0);
            }}
            onFocus={() => {
              if (items.length > 0) setOpen(true);
            }}
            autoComplete="street-address"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="start"
        collisionPadding={10}
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="max-h-[260px] w-full">
          <CommandList>
            {effectiveQuery.trim().length < 3 ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                Keep typing… (at least 3 characters)
              </div>
            ) : isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : items.length === 0 ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                No address found.
              </div>
            ) : (
              <CommandGroup>
                {items.map((s) => (
                  <CommandItem
                    key={s.formatted}
                    className="flex w-full items-center"
                    onSelect={() => {
                      onSelectSuggestion(s);
                      setOpen(false);
                      setItems([]);
                    }}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {s.address1}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {s.formatted}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
