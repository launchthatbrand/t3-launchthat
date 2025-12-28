"use client";

// Register page templates (side-effect import)
import "~/lib/pageTemplates";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Save } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";

import { useTenant } from "~/context/TenantContext";
import {
  DEFAULT_PAGE_TEMPLATE_SLUG,
  listPageTemplates,
  PAGE_TEMPLATE_ACCESS_OPTION_KEY,
} from "~/lib/pageTemplates/registry";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { cn } from "~/lib/utils";

interface OrgOption {
  id: string;
  name: string;
  slug?: string;
}

const PAGE_TEMPLATE_KEY = PAGE_TEMPLATE_ACCESS_OPTION_KEY;
const PORTAL_ROOT_SLUG = "portal-root";

export default function PageTemplatesSettingsPage() {
  const tenant = useTenant();
  const tenantOrgId = getTenantOrganizationId(tenant);
  const isPortalRoot = tenant?.slug === PORTAL_ROOT_SLUG;

  const organizations = useQuery(
    api.core.organizations.queries.myOrganizations,
    isPortalRoot ? {} : "skip",
  ) as { _id: Id<"organizations">; name: string; slug?: string }[] | undefined;

  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    tenantOrgId ? (tenantOrgId as unknown as string) : undefined,
  );

  useEffect(() => {
    if (!isPortalRoot && tenantOrgId) {
      setSelectedOrgId(tenantOrgId as unknown as string);
    }
  }, [isPortalRoot, tenantOrgId]);

  useEffect(() => {
    if (isPortalRoot && !selectedOrgId && organizations?.length) {
      const first = organizations[0]?._id as string | undefined;
      if (first) {
        setSelectedOrgId(first);
      }
    }
  }, [isPortalRoot, organizations, selectedOrgId]);

  const optionDoc = useQuery(
    api.core.options.get,
    selectedOrgId
      ? ({
          orgId: selectedOrgId as Id<"organizations">,
          type: "site",
          metaKey: PAGE_TEMPLATE_KEY,
        } as const)
      : "skip",
  ) as { metaValue?: unknown } | undefined;

  const setOption = useMutation(api.core.options.set);

  const allowedState = useMemo(() => {
    const value = optionDoc?.metaValue;
    if (
      value &&
      typeof value === "object" &&
      Array.isArray((value as { allowed?: unknown }).allowed)
    ) {
      return (value as { allowed: string[] }).allowed;
    }
    return undefined;
  }, [optionDoc]);

  const [allowed, setAllowed] = useState<string[] | undefined>(allowedState);
  const allowAll = allowed === undefined || allowed.length === 0;

  useEffect(() => {
    setAllowed(allowedState);
  }, [allowedState]);

  const templates = useMemo(
    () => listPageTemplates(selectedOrgId),
    [selectedOrgId],
  );

  const toggleTemplate = (slug: string) => {
    setAllowed((prev) => {
      const current =
        prev && prev.length > 0 ? new Set(prev) : new Set<string>();
      if (current.has(slug)) {
        current.delete(slug);
      } else {
        current.add(slug);
      }
      const next = Array.from(current);
      return next;
    });
  };

  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!selectedOrgId) return;
    setSaving(true);
    try {
      const normalizedAllowed =
        allowed && allowed.length > 0
          ? Array.from(new Set([...allowed, DEFAULT_PAGE_TEMPLATE_SLUG]))
          : [];
      await setOption({
        orgId: selectedOrgId as Id<"organizations">,
        type: "site",
        metaKey: PAGE_TEMPLATE_KEY,
        metaValue: { allowed: normalizedAllowed },
      });
    } finally {
      setSaving(false);
    }
  };

  const orgOptions: OrgOption[] = useMemo(() => {
    if (!organizations) return [];
    return organizations.map((org) => ({
      id: org._id as string,
      name: org.name,
      slug: org.slug,
    }));
  }, [organizations]);

  const activeOrgName =
    orgOptions.find((org) => org.id === selectedOrgId)?.name ?? "Current";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setAllowed([])}
            disabled={saving}
          >
            Allow all
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedOrgId}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save
              </>
            )}
          </Button>
        </div>
      </div>

      {isPortalRoot && (
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              Select the organization to configure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedOrgId}
              onValueChange={(value) => setSelectedOrgId(value)}
            >
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {orgOptions.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name} {org.slug ? `(${org.slug})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Templates for {activeOrgName}</CardTitle>
          <CardDescription>
            Toggle availability. Default is always available. Empty list means
            all templates allowed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Allow all templates</div>
              <div className="text-muted-foreground text-sm">
                When enabled, all registered templates are available.
              </div>
            </div>
            <Switch
              checked={allowAll}
              onCheckedChange={(checked) =>
                setAllowed(checked ? [] : [DEFAULT_PAGE_TEMPLATE_SLUG])
              }
            />
          </div>
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((template) => {
              const enabled =
                allowAll ||
                (Array.isArray(allowed) && allowed.includes(template.slug));
              return (
                <div
                  key={template.slug}
                  className={cn(
                    "rounded-lg border p-3",
                    enabled ? "border-primary" : "border-border",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{template.label}</div>
                      <div className="text-muted-foreground text-sm">
                        {template.description ?? template.slug}
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      disabled={
                        allowAll || template.slug === DEFAULT_PAGE_TEMPLATE_SLUG
                      }
                      onCheckedChange={() => toggleTemplate(template.slug)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
