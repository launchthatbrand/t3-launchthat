"use client";

import Image from "next/image";
import React from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";

import { api } from "@convex-config/_generated/api";

interface Org {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  description?: string;
  logo?: string;
}

export default function AdminOrganizationPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const org = useQuery(
    api.coreTenant.organizations.getOrganizationById,
    organizationId ? { organizationId } : "skip",
  ) as Org | null | undefined;

  const updateOrg = useMutation(api.coreTenant.organizations.updateOrganization);
  const [draftName, setDraftName] = React.useState("");
  const [draftSlug, setDraftSlug] = React.useState("");
  const [draftLogo, setDraftLogo] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!org) return;
    setDraftName(org.name);
    setDraftSlug(org.slug);
    setDraftLogo(org.logo ?? "");
  }, [org]);

  const canSave = Boolean(organizationId) && draftName.trim().length > 0 && !isSaving;

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
        <p className="text-muted-foreground mt-1">
          Update organization settings (slug + featured image).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {org === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : org === null ? (
            <div className="text-muted-foreground text-sm">Organization not found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs">Name</div>
                  <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs">Slug</div>
                  <Input
                    value={draftSlug}
                    onChange={(e) => setDraftSlug(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground text-xs">Featured image (URL)</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    value={draftLogo}
                    onChange={(e) => setDraftLogo(e.target.value)}
                    placeholder="https://…"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!draftLogo.trim() || isSaving}
                    onClick={async () => {
                      if (!organizationId) return;
                      setIsSaving(true);
                      try {
                        await updateOrg({ organizationId, logo: null });
                        setDraftLogo("");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>

                {draftLogo.trim() ? (
                  <div className="relative mt-2 h-32 w-full overflow-hidden rounded-md border bg-muted/20">
                    <Image
                      src={draftLogo.trim()}
                      alt="Organization featured image"
                      fill
                      sizes="(max-width: 768px) 100vw, 700px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end">
                <Button
                  disabled={!canSave}
                  onClick={async () => {
                    if (!organizationId) return;
                    setIsSaving(true);
                    try {
                      await updateOrg({
                        organizationId,
                        name: draftName.trim(),
                        slug: draftSlug.trim(),
                        logo: draftLogo.trim() ? draftLogo.trim() : null,
                      });
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

