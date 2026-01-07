"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface RagIndexStatus {
  isEnabledForPostType: boolean;
  sourceType?: "postType" | "lmsPostType";
  entryKey?: string;
  lastStatus?: string;
  lastAttemptAt?: number;
  lastSuccessAt?: number;
  lastError?: string;
  lastEntryId?: string;
  lastEntryStatus?: "pending" | "ready" | "replaced";
  config?: {
    displayName?: string;
    fields?: string[];
    includeTags?: boolean;
    metaFieldKeys?: string[];
    additionalMetaKeys?: string;
    lastIndexedAt?: number;
  };
}

const formatTime = (value?: number) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

export const AiIndexTab = ({
  organizationId,
  postTypeSlug,
  postId,
  ragIndexStatus,
}: {
  organizationId?: string;
  postTypeSlug: string;
  postId: string;
  ragIndexStatus?: RagIndexStatus;
}) => {
  const triggerReindex = useMutation(
    api.plugins.support.mutations.triggerRagReindexForPost,
  );
  const [isReindexing, setIsReindexing] = useState(false);

  const enabled = Boolean(ragIndexStatus?.isEnabledForPostType);
  const displayName = ragIndexStatus?.config?.displayName ?? postTypeSlug;

  const fieldsLabel = useMemo(() => {
    const fields = ragIndexStatus?.config?.fields ?? [];
    return fields.length > 0 ? fields.join(", ") : "—";
  }, [ragIndexStatus?.config?.fields]);

  const metaKeysLabel = useMemo(() => {
    const keys = ragIndexStatus?.config?.metaFieldKeys ?? [];
    const extra = ragIndexStatus?.config?.additionalMetaKeys ?? "";
    const merged = [
      ...keys,
      ...extra
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ];
    return merged.length > 0 ? merged.join(", ") : "—";
  }, [ragIndexStatus?.config?.additionalMetaKeys, ragIndexStatus?.config?.metaFieldKeys]);

  const handleReindex = async () => {
    if (!organizationId) {
      toast.error("Missing organizationId");
      return;
    }
    if (!postId) {
      toast.error("Missing postId");
      return;
    }
    setIsReindexing(true);
    try {
      await triggerReindex({
        organizationId: organizationId as unknown as Id<"organizations">,
        postTypeSlug,
        postId,
      });
      toast.success("Re-index scheduled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to re-index");
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>AI Index Status</CardTitle>
          <Button
            type="button"
            variant="secondary"
            onClick={handleReindex}
            disabled={!enabled || isReindexing}
          >
            {isReindexing ? "Scheduling…" : "Re-index now"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground">Post type</div>
              <div className="font-medium">{displayName}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Enabled</div>
              <div className="font-medium">{enabled ? "Yes" : "No"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Source type</div>
              <div className="font-medium">{ragIndexStatus?.sourceType ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Entry key</div>
              <div className="font-mono text-xs">{ragIndexStatus?.entryKey ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Last status</div>
              <div className="font-medium">{ragIndexStatus?.lastStatus ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">RAG entry status</div>
              <div className="font-medium">{ragIndexStatus?.lastEntryStatus ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Last attempt</div>
              <div className="font-medium">{formatTime(ragIndexStatus?.lastAttemptAt)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Last success</div>
              <div className="font-medium">{formatTime(ragIndexStatus?.lastSuccessAt)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Fields indexed</div>
              <div className="font-medium">{fieldsLabel}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Meta keys indexed</div>
              <div className="font-medium">{metaKeysLabel}</div>
            </div>
          </div>

          {ragIndexStatus?.lastError ? (
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground mb-1 text-xs">Last error</div>
              <div className="font-mono text-xs">{ragIndexStatus.lastError}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};


