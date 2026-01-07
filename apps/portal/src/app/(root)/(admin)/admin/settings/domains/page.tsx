"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import React from "react";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { Copy, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { useTenant } from "~/context/TenantContext";
import { OrganizationDomainsCard } from "../organizations/_components/OrganizationDomainsCard";

interface DomainRecord { type: string; name: string; value: string }

type OrgEmailDomainMeta = Pick<
  Doc<"organizations">,
  "slug" | "customDomain"
> & {
  emailDomain?: string;
  emailDomainStatus?: "unconfigured" | "pending" | "verified" | "error";
  emailDomainRecords?: DomainRecord[];
  emailDomainLastError?: string;
};

export default function AdminDomainsSettingsPage() {
  const tenant = useTenant();
  const orgId = tenant?._id;

  const org = useQuery(
    api.core.organizations.queries.getById,
    orgId ? { organizationId: orgId } : "skip",
  ) as OrgEmailDomainMeta | null | undefined;

  const syncEmailDomain = useAction(
    api.core.organizations.emailDomains.syncEmailDomainFromCustomDomain,
  );

  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [recordsOverride, setRecordsOverride] = React.useState<
    DomainRecord[] | null
  >(null);
  const [statusOverride, setStatusOverride] = React.useState<
    "unconfigured" | "pending" | "verified" | "error" | null
  >(null);
  const [emailDomainOverride, setEmailDomainOverride] = React.useState<
    string | null
  >(null);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSyncEmailDomain = async () => {
    if (!orgId) return;
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      setSyncError(null);
      const result = await syncEmailDomain({ organizationId: orgId });
      setEmailDomainOverride(result.emailDomain);
      setStatusOverride(result.status);
      setRecordsOverride(result.records);

      setSyncMessage(
        result.status === "verified"
          ? "Email domain verified in Resend."
          : result.status === "pending"
            ? "Email domain created/updated. Add the DNS records below, then click Verify again."
            : result.status === "unconfigured"
              ? "Set a website custom domain first, then set up email domain."
              : "Email domain sync failed. See error details.",
      );
      toast.success("Email domain sync complete");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setSyncError(msg);
      toast.error("Email domain sync failed", { description: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!orgId) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Domains</CardTitle>
            <CardDescription>Select an organization first.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    );
  }

  const emailDomain = emailDomainOverride ?? org?.emailDomain ?? null;
  const emailDomainStatus =
    statusOverride ?? org?.emailDomainStatus ?? "unconfigured";
  const emailDomainRecords = recordsOverride ?? org?.emailDomainRecords ?? [];
  const emailDomainLastError = org?.emailDomainLastError ?? null;

  return (
    <div className="mx-auto space-y-6">
      <OrganizationDomainsCard organizationId={orgId} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email domain (Resend)
          </CardTitle>
          <CardDescription>
            Resend requires you to verify the sending domain before you can send
            emails from it. We derive the apex domain from your website custom
            domain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-sm">
            Derived domain:{" "}
            <span className="font-mono">
              {emailDomain ?? "(not configured)"}
            </span>
          </div>
          <div className="text-muted-foreground text-sm">
            Status: <span className="font-mono">{emailDomainStatus}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleSyncEmailDomain()}
              disabled={isSyncing}
            >
              {isSyncing ? "Working…" : "Start email setup"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSyncEmailDomain()}
              disabled={isSyncing}
            >
              {isSyncing ? "Checking…" : "Verify"}
            </Button>
          </div>

          {syncMessage ? (
            <p className="text-sm text-emerald-600">{syncMessage}</p>
          ) : null}
          {syncError ? (
            <p className="text-destructive text-sm">{syncError}</p>
          ) : null}
          {emailDomainLastError ? (
            <p className="text-destructive text-sm">{emailDomainLastError}</p>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">DNS records (Resend)</p>
            {emailDomainRecords.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Click “Start email setup” to generate DNS records for Resend
                verification.
              </p>
            ) : (
              <div className="space-y-2">
                {emailDomainRecords.map((rec) => {
                  const line = `${rec.type} ${rec.name} ${rec.value}`;
                  return (
                    <div
                      key={line}
                      className="bg-card flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs">{line}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Copy DNS record"
                        onClick={() => void handleCopy(line)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-muted-foreground text-sm">
            Tip: website routing DNS records (Vercel) and email DNS records
            (Resend) are separate. You need both to fully set up{" "}
            <span className="font-mono">{emailDomain ?? ""}</span>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
