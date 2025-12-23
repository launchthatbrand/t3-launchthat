import React from "react";

import { Button } from "@acme/ui/button";

interface TopBarProps {
  onLogStructure: () => void;
  vimeoSyncStatus?: {
    status: "idle" | "running" | "error" | "done";
    nextPage: number;
    perPage: number;
    syncedCount: number;
    pagesFetched: number;
    workflowId?: string;
    lastError?: string;
    startedAt?: number;
    finishedAt?: number;
    updatedAt: number;
  } | null;
  onStartVimeoSync?: () => void;
}

const formatTimestamp = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return null;
  }
};

const TopBar: React.FC<TopBarProps> = ({
  onLogStructure,
  vimeoSyncStatus,
  onStartVimeoSync,
}) => {
  const lastSyncLabel = formatTimestamp(vimeoSyncStatus?.finishedAt ?? null);
  const statusLabel =
    vimeoSyncStatus?.status === "running"
      ? `Syncing… (${vimeoSyncStatus.pagesFetched} pages, ${vimeoSyncStatus.syncedCount} videos)`
      : vimeoSyncStatus?.status === "error"
        ? "Sync error"
        : vimeoSyncStatus?.status === "done"
          ? "Synced"
          : null;
  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-4 py-2 shadow-sm">
      <div className="flex items-center">
        {" "}
        {/* Left side (placeholder) */}
        <span className="text-lg font-semibold">Course Builder</span>
      </div>
      <div className="flex items-center gap-2">
        {" "}
        {/* Right side */}
        {onStartVimeoSync ? (
          <div className="flex items-center gap-2">
            {statusLabel ? (
              <span className="text-muted-foreground hidden text-xs md:inline">
                Vimeo: {statusLabel}
              </span>
            ) : null}
            {lastSyncLabel ? (
              <span className="text-muted-foreground hidden text-xs md:inline">
                Last: {lastSyncLabel}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStartVimeoSync}
              disabled={vimeoSyncStatus?.status === "running"}
            >
              {vimeoSyncStatus?.status === "running"
                ? "Syncing…"
                : "Start Vimeo Sync"}
            </Button>
          </div>
        ) : null}
        <Button type="button" size="sm" onClick={onLogStructure}>
          Log Structure
        </Button>
      </div>
    </div>
  );
};

export default TopBar;
