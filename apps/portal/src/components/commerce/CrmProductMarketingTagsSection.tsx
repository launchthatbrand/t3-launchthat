"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const apiAny: any = require("@/convex/_generated/api").api;

const CRM_MARKETING_TAG_IDS_KEY = "crm.marketingTagIdsJson";

type MarketingTag = {
  _id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
};

const safeParseStringArray = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  const raw = value.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === "string" ? v : ""))
      .map((v) => v.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const serializeStringArray = (values: string[]): string =>
  JSON.stringify(values.map((v) => v.trim()).filter(Boolean));

export function CrmProductMarketingTagsSection(props: {
  canEdit: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValue: (key: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (key: string, value: any) => void;
  organizationId: string | null;
}) {
  const { canEdit, getValue, setValue, organizationId } = props;

  const [search, setSearch] = useState("");

  const tags = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiAny.plugins.crm.marketingTags.queries.listMarketingTags,
    organizationId ? ({ organizationId } as any) : {},
  ) as unknown as MarketingTag[] | undefined;

  const selectedIds = useMemo(() => {
    const raw = getValue(CRM_MARKETING_TAG_IDS_KEY);
    return safeParseStringArray(raw);
  }, [getValue]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filteredTags = useMemo(() => {
    const list = Array.isArray(tags) ? tags : [];
    const q = search.trim().toLowerCase();
    const base = q
      ? list.filter((t) => {
          const name = typeof t.name === "string" ? t.name : "";
          const slug = typeof t.slug === "string" ? t.slug : "";
          return (
            name.toLowerCase().includes(q) || slug.toLowerCase().includes(q)
          );
        })
      : list;

    return [...base].sort((a, b) => a.name.localeCompare(b.name));
  }, [tags, search]);

  const setSelected = (next: string[]) => {
    const normalized = next.map((v) => v.trim()).filter(Boolean);
    if (normalized.length === 0) {
      setValue(CRM_MARKETING_TAG_IDS_KEY, null);
      return;
    }
    setValue(CRM_MARKETING_TAG_IDS_KEY, serializeStringArray(normalized));
  };

  const toggleTag = (tagId: string, enabled: boolean) => {
    const next = new Set(selectedSet);
    if (enabled) next.add(tagId);
    else next.delete(tagId);
    setSelected([...next]);
  };

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="space-y-1">
        <Label className="text-base font-semibold">
          CRM: grant marketing tags on purchase
        </Label>
        <p className="text-muted-foreground text-xs">
          When this product is purchased, the buyer’s CRM contact will be
          assigned these marketing tags.
        </p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Search tags…"
          disabled={!canEdit}
          className="md:max-w-sm"
        />
        <div className="text-muted-foreground text-xs">
          Selected: {selectedIds.length}
        </div>
      </div>

      <div className="max-h-72 space-y-2 overflow-auto pr-1">
        {filteredTags.map((tag) => {
          const id = String(tag._id ?? "");
          if (!id) return null;
          const label =
            typeof tag.slug === "string" && tag.slug.trim().length > 0
              ? `${tag.name} (${tag.slug})`
              : tag.name;
          const checked = selectedSet.has(id);

          return (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted/40"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => toggleTag(id, value === true)}
                disabled={!canEdit}
              />
              <div className="min-w-0">
                <div className="truncate font-medium">{label}</div>
                <div className="text-muted-foreground truncate text-xs">{id}</div>
              </div>
            </label>
          );
        })}

        {filteredTags.length === 0 ? (
          <div className="text-muted-foreground text-sm">No tags found.</div>
        ) : null}
      </div>
    </div>
  );
}


