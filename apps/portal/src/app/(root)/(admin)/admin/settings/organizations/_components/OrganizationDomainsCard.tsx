"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import React from "react";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { Copy, Globe } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";

import { rootDomain } from "~/lib/utils";

type DomainRecord = { type: string; name: string; value: string };

type OrganizationDomainMeta = Pick<Doc<"organizations">, "slug"> & {
  customDomain?: string;
  customDomainStatus: "unconfigured" | "pending" | "verified" | "error";
  customDomainRecords?: DomainRecord[];
};

export const OrganizationDomainsCard = ({
  organizationId,
}: {
  organizationId: Id<"organizations">;
}) => {
  const organization = useQuery(api.core.organizations.queries.getById, {
    organizationId,
  }) as OrganizationDomainMeta | null | undefined;

  const [customDomainDraft, setCustomDomainDraft] = React.useState("");
  const [isStartingDomain, setIsStartingDomain] = React.useState(false);
  const [isVerifyingDomain, setIsVerifyingDomain] = React.useState(false);
  const [domainMessage, setDomainMessage] = React.useState<string | null>(null);
  const [domainError, setDomainError] = React.useState<string | null>(null);
  const [domainRecordsOverride, setDomainRecordsOverride] = React.useState<
    DomainRecord[] | null
  >(null);
  const [domainStatusOverride, setDomainStatusOverride] = React.useState<
    "unconfigured" | "pending" | "verified" | "error" | null
  >(null);

  React.useEffect(() => {
    if (!organization) return;
    setCustomDomainDraft(organization.customDomain ?? "");
  }, [organization]);

  const startCustomDomainSetup = useAction(
    api.core.organizations.domains.startCustomDomainSetup,
  );
  const verifyCustomDomain = useAction(
    api.core.organizations.domains.verifyCustomDomain,
  );

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleStartDomainSetup = async () => {
    const domain = customDomainDraft.trim();
    if (!domain) {
      toast.error("Enter a domain first.");
      return;
    }
    try {
      setIsStartingDomain(true);
      setDomainError(null);
      setDomainMessage(null);
      const result = (await startCustomDomainSetup({
        organizationId,
        domain,
      })) as {
        customDomain: string;
        status: "unconfigured" | "pending" | "verified" | "error";
        records: DomainRecord[];
      };
      setCustomDomainDraft(result.customDomain);
      setDomainStatusOverride(result.status);
      setDomainRecordsOverride(result.records);
      setDomainMessage(
        result.status === "verified"
          ? "Domain verified."
          : "Domain added. Update DNS records, then click Verify.",
      );
      toast.success("Domain setup started");
    } catch (error) {
      console.error(error);
      setDomainError(
        error instanceof Error ? error.message : "Failed to start domain setup",
      );
    } finally {
      setIsStartingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    try {
      setIsVerifyingDomain(true);
      setDomainError(null);
      setDomainMessage(null);
      const result = (await verifyCustomDomain({
        organizationId,
      })) as {
        customDomain: string;
        status: "unconfigured" | "pending" | "verified" | "error";
        records: DomainRecord[];
      };
      setCustomDomainDraft(result.customDomain);
      setDomainStatusOverride(result.status);
      setDomainRecordsOverride(result.records);
      setDomainMessage(
        result.status === "verified"
          ? "Domain verified."
          : "Not verified yet. DNS may still be propagating.",
      );
      toast.success("Verification check complete");
    } catch (error) {
      console.error(error);
      setDomainError(
        error instanceof Error ? error.message : "Verification failed",
      );
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  if (organization === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domains
          </CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domains
          </CardTitle>
          <CardDescription>Organization not found.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  const status = domainStatusOverride ?? organization.customDomainStatus;
  const records = domainRecordsOverride ?? organization.customDomainRecords ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Domains
        </CardTitle>
        <CardDescription>
          Connect a domain to this organization. After verification, both the
          custom domain and the launchthat subdomain will work.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground text-sm">
          Status: <span className="font-mono">{status}</span>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Domain</span>
          <Input
            value={customDomainDraft}
            onChange={(e) => setCustomDomainDraft(e.target.value)}
            placeholder="dev.wsatraining.com"
            className="max-w-md"
          />
          <p className="text-muted-foreground text-sm">
            Use the domain without protocol. Apex domains are supported if your
            DNS provider supports ALIAS/ANAME.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void handleStartDomainSetup()}
            disabled={isStartingDomain || isVerifyingDomain}
          >
            {isStartingDomain ? "Starting…" : "Start setup"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleVerifyDomain()}
            disabled={isStartingDomain || isVerifyingDomain}
          >
            {isVerifyingDomain ? "Verifying…" : "Verify"}
          </Button>
        </div>

        {domainMessage ? (
          <p className="text-sm text-emerald-600">{domainMessage}</p>
        ) : null}
        {domainError ? <p className="text-destructive text-sm">{domainError}</p> : null}

        <div className="space-y-2">
          <p className="text-sm font-medium">DNS records</p>
          {records.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Start setup to generate DNS records.
            </p>
          ) : (
            <div className="space-y-2">
              {records.map((rec) => {
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

        <div className="space-y-2">
          <p className="text-sm font-medium">Access URLs</p>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2">
            <p className="text-xs font-mono">
              https://{organization.slug}.{rootDomain}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Copy launchthat URL"
              onClick={() =>
                void handleCopy(`https://${organization.slug}.${rootDomain}`)
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {customDomainDraft.trim() ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2">
              <p className="text-xs font-mono">https://{customDomainDraft.trim()}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Copy custom domain URL"
                onClick={() =>
                  void handleCopy(`https://${customDomainDraft.trim()}`)
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};


