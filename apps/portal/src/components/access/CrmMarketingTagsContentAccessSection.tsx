"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Plus, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { AccessRule } from "~/components/admin/ContentAccess";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const apiAny: any = require("@/convex/_generated/api").api;

interface MarketingTag {
  _id: string;
  name: string;
  slug?: string;
}

export function CrmMarketingTagsContentAccessSection(props: {
  rules: AccessRule;
  setRules: React.Dispatch<React.SetStateAction<AccessRule>>;
  disabled: boolean;
}) {
  const { rules, setRules, disabled } = props;
  const [requiredTagInput, setRequiredTagInput] = useState("");
  const [excludedTagInput, setExcludedTagInput] = useState("");

  const tags = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiAny.plugins.crm.marketingTags.queries.listMarketingTags,
    {},
  ) as unknown as MarketingTag[] | undefined;

  const tagOptions = useMemo(() => {
    const list = Array.isArray(tags) ? tags : [];
    return list
      .map((t) => ({
        key: t.slug ?? t._id,
        label: t.slug ? `${t.name} (${t.slug})` : t.name,
      }))
      .filter((t) => typeof t.key === "string" && t.key.length > 0);
  }, [tags]);

  const addRequiredTag = (tagIdRaw: string) => {
    const tagId = tagIdRaw.trim();
    if (!tagId) return;
    if (!rules.requiredTags.tagIds.includes(tagId)) {
      setRules((prev) => ({
        ...prev,
        requiredTags: {
          ...prev.requiredTags,
          tagIds: [...prev.requiredTags.tagIds, tagId],
        },
      }));
    }
  };

  const removeRequiredTag = (tagId: string) => {
    setRules((prev) => ({
      ...prev,
      requiredTags: {
        ...prev.requiredTags,
        tagIds: prev.requiredTags.tagIds.filter((id) => id !== tagId),
      },
    }));
  };

  const addExcludedTag = (tagIdRaw: string) => {
    const tagId = tagIdRaw.trim();
    if (!tagId) return;
    if (!rules.excludedTags.tagIds.includes(tagId)) {
      setRules((prev) => ({
        ...prev,
        excludedTags: {
          ...prev.excludedTags,
          tagIds: [...prev.excludedTags.tagIds, tagId],
        },
      }));
    }
  };

  const removeExcludedTag = (tagId: string) => {
    setRules((prev) => ({
      ...prev,
      excludedTags: {
        ...prev.excludedTags,
        tagIds: prev.excludedTags.tagIds.filter((id) => id !== tagId),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-semibold">Marketing Tag Access</Label>
        <p className="text-xs text-muted-foreground">
          Provided by the CRM plugin. Use slugs or ids.
        </p>
      </div>

      {/* Required Tags */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Required Tags</Label>
          <Select
            value={rules.requiredTags.mode}
            onValueChange={(value: "all" | "some") =>
              setRules((prev) => ({
                ...prev,
                requiredTags: { ...prev.requiredTags, mode: value },
              }))
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="some">Some</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tagOptions.length > 0 ? (
          <Select
            value=""
            onValueChange={(value: string) => addRequiredTag(value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add from known tags…" />
            </SelectTrigger>
            <SelectContent>
              {tagOptions.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {rules.requiredTags.tagIds.map((tagId) => (
            <Badge
              key={tagId}
              variant="outline"
              className="flex items-center gap-1"
            >
              {tagId}
              <button
                type="button"
                disabled={disabled}
                className="inline-flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeRequiredTag(tagId);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={requiredTagInput}
            onChange={(e) => setRequiredTagInput(e.target.value)}
            placeholder="Add required tag (slug or id)"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              addRequiredTag(requiredTagInput);
              setRequiredTagInput("");
            }}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Excluded Tags */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Excluded Tags</Label>
          <Select
            value={rules.excludedTags.mode}
            onValueChange={(value: "all" | "some") =>
              setRules((prev) => ({
                ...prev,
                excludedTags: { ...prev.excludedTags, mode: value },
              }))
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="some">Some</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tagOptions.length > 0 ? (
          <Select
            value=""
            onValueChange={(value: string) => addExcludedTag(value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add from known tags…" />
            </SelectTrigger>
            <SelectContent>
              {tagOptions.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {rules.excludedTags.tagIds.map((tagId) => (
            <Badge
              key={tagId}
              variant="outline"
              className="flex items-center gap-1"
            >
              {tagId}
              <button
                type="button"
                disabled={disabled}
                className="inline-flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeExcludedTag(tagId);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={excludedTagInput}
            onChange={(e) => setExcludedTagInput(e.target.value)}
            placeholder="Add excluded tag (slug or id)"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              addExcludedTag(excludedTagInput);
              setExcludedTagInput("");
            }}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


