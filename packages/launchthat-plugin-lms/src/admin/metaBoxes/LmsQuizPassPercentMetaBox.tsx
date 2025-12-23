"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Skeleton } from "@acme/ui/skeleton";
import { toast } from "@acme/ui/toast";

const PASS_PERCENT_META_KEY = "passPercent";

const readMetaNumber = (raw: unknown): number | null => {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const LmsQuizPassPercentMetaBox = ({
  context,
}: PluginMetaBoxRendererProps) => {
  const postId = context.postId;
  const organizationId = context.organizationId;

  const updatePost = useMutation((api.plugins.lms.posts.mutations as any).updatePost);
  const postMeta = useQuery(
    (api.plugins.lms.posts.queries as any).getPostMeta,
    postId
      ? { postId, organizationId: organizationId ?? undefined }
      : "skip",
  ) as any[] | undefined;

  const [value, setValue] = useState<string>("70");
  const [initialValue, setInitialValue] = useState<string>("70");
  const [hasHydrated, setHasHydrated] = useState(false);

  const isLoading = postId ? postMeta === undefined : false;

  const currentNumber = useMemo(() => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, [value]);

  useEffect(() => {
    if (hasHydrated) return;
    if (postMeta === undefined) return;
    const map = new Map<string, unknown>();
    (postMeta ?? []).forEach((entry) => {
      if (entry?.key) map.set(String(entry.key), entry.value);
    });
    const existing = readMetaNumber(map.get(PASS_PERCENT_META_KEY));
    const next = typeof existing === "number" ? String(existing) : "70";
    setValue(next);
    setInitialValue(next);
    setHasHydrated(true);
  }, [hasHydrated, postMeta]);

  const isDirty = value !== initialValue;

  const handleSave = useCallback(async () => {
    if (!postId) return;
    const parsed = currentNumber;
    if (parsed === null) {
      toast.error("Pass percent must be a number.");
      return;
    }
    if (parsed < 0 || parsed > 100) {
      toast.error("Pass percent must be between 0 and 100.");
      return;
    }

    try {
      await updatePost({
        id: postId,
        meta: {
          [PASS_PERCENT_META_KEY]: parsed,
        },
      });
      setInitialValue(String(parsed));
      toast.success("Pass percent updated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update pass percent.");
    }
  }, [currentNumber, postId, updatePost]);

  if (!postId) {
    return (
      <div className="text-muted-foreground text-sm">
        Save this entry first to configure passing rules.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lms-quiz-pass-percent">Pass percent</Label>
          <div className="flex items-center gap-2">
            <Input
              id="lms-quiz-pass-percent"
              type="number"
              min={0}
              max={100}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Button type="button" size="sm" disabled={!isDirty} onClick={handleSave}>
              Save
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Default is 70%. Badge awards for this quiz require the user’s score to
            meet or exceed this value.
          </p>
        </div>
      )}
    </div>
  );
};


