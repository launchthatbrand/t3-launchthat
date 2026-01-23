"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Image from "next/image";
import { Input } from "@acme/ui/input";
import { MediaLibraryDialog } from "launchthat-plugin-core-tenant/frontend";
import { OrganizationTabs } from "./_components/OrganizationTabs";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { useParams } from "next/navigation";

interface Org {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  description?: string;
  logoMediaId?: string;
  logoUrl: string | null;
}

interface OrganizationMediaRow {
  _id: string;
  url: string | null;
  filename?: string;
  contentType: string;
  createdAt: number;
}

export default function PlatformOrganizationGeneralPage() {
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
  const [draftLogoMediaId, setDraftLogoMediaId] = React.useState<string | null>(
    null,
  );
  const [draftLogoPreviewUrl, setDraftLogoPreviewUrl] = React.useState<
    string | null
  >(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!org) return;
    setDraftName(org.name);
    setDraftSlug(org.slug);
    setDraftLogoMediaId(org.logoMediaId ?? null);
    setDraftLogoPreviewUrl(null);
  }, [org]);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
          <Badge variant="outline" className="font-mono">
            {organizationId || "—"}
          </Badge>
        </div>
        <OrganizationTabs />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs">Owner</div>
                  <div className="font-mono text-sm">{org.ownerId}</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-muted-foreground text-xs">Featured image</div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setLogoPickerOpen(true)}
                  >
                    Choose image…
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!draftLogoMediaId || isSaving}
                    onClick={() => {
                      setDraftLogoMediaId(null);
                      setDraftLogoPreviewUrl(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>

                {(draftLogoPreviewUrl ?? org.logoUrl) ? (
                  <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-md border bg-muted/20">
                    <Image
                      src={(draftLogoPreviewUrl ?? org.logoUrl) ?? ""}
                      alt="Organization featured image"
                      fill
                      sizes="(max-width: 768px) 100vw, 700px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  disabled={!draftName.trim() || !draftSlug.trim() || isSaving}
                  onClick={async () => {
                    if (!organizationId) return;
                    setIsSaving(true);
                    try {
                      await updateOrg({
                        organizationId,
                        name: draftName.trim(),
                        slug: draftSlug.trim(),
                        // Clear legacy URL field; logo is now driven by org media library.
                        logo: null,
                        logoMediaId: draftLogoMediaId,
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

      {organizationId ? (
        <MediaLibraryDialog<
          { organizationId: string; limit?: number },
          { organizationId: string },
          {
            organizationId: string;
            storageId: string;
            contentType: string;
            size: number;
            filename?: string;
          },
          OrganizationMediaRow
        >
          open={logoPickerOpen}
          onOpenChange={setLogoPickerOpen}
          title="Organization media"
          listRef={api.coreTenant.organizations.listOrganizationMedia}
          listArgs={{ organizationId, limit: 200 }}
          generateUploadUrlRef={api.coreTenant.organizations.generateOrganizationMediaUploadUrl}
          uploadArgs={{ organizationId }}
          createRef={api.coreTenant.organizations.createOrganizationMedia}
          buildCreateArgs={({ storageId, file }) => ({
            organizationId,
            storageId,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            filename: file.name,
          })}
          onSelect={(item) => {
            setDraftLogoMediaId(item._id);
            setDraftLogoPreviewUrl(item.url);
          }}
        />
      ) : null}
    </div>
  );
}

