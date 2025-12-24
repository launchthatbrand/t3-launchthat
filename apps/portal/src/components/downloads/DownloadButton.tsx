"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

export interface DownloadButtonProps {
  downloadId: Id<"downloads">;
  label?: string;
  expiresInSeconds?: number;
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  downloadId,
  label = "Download",
  expiresInSeconds = 300,
  className,
}) => {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const requestDownloadUrl = useMutation(api.core.downloads.mutations.requestDownloadUrl);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (!organizationId) {
      toast.error("Missing organization.");
      return;
    }
    setIsLoading(true);
    try {
      const url = await requestDownloadUrl({
        organizationId,
        downloadId,
        expiresInSeconds,
      });
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        // Fallback if the browser blocks popups.
        window.location.href = url;
      }
    } catch (error) {
      toast.error("Download failed.", {
        description: error instanceof Error ? error.message : "Unexpected error.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [downloadId, expiresInSeconds, organizationId, requestDownloadUrl]);

  return (
    <Button type="button" onClick={handleClick} disabled={isLoading} className={className}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
};


