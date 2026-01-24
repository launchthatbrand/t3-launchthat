"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { OrgPublicProfile, type OrgPublicProfileConfigV1 } from "~/components/publicProfiles/OrgPublicProfile";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { Button } from "@acme/ui/button";
import { MediaLibraryDialog } from "launchthat-plugin-core-tenant/frontend";

interface OrgRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoMediaId?: string;
  logoUrl: string | null;
  publicProfileConfig?: unknown;
}

interface OrganizationMediaRow {
  _id: string;
  url: string | null;
  filename?: string;
  contentType: string;
  createdAt: number;
}

const DEFAULT_CONFIG: OrgPublicProfileConfigV1 = {
  version: "v1",
  heroCtas: [{ id: "join", label: "Join TraderLaunchpad", url: "/join", variant: "primary" }],
  logoCrop: { x: 50, y: 50 },
  links: [],
  sections: [
    { id: "hero", kind: "hero", enabled: true },
    { id: "about", kind: "about", enabled: true },
    { id: "links", kind: "links", enabled: true },
    { id: "stats", kind: "stats", enabled: true },
  ],
};

const normalizeConfig = (raw: unknown): OrgPublicProfileConfigV1 => {
  if (!raw || typeof raw !== "object") return DEFAULT_CONFIG;
  const v = raw as Partial<OrgPublicProfileConfigV1>;
  if (v.version !== "v1") return DEFAULT_CONFIG;
  return {
    version: "v1",
    heroCtas: Array.isArray(v.heroCtas)
      ? (v.heroCtas as OrgPublicProfileConfigV1["heroCtas"])
      : DEFAULT_CONFIG.heroCtas,
    logoCrop:
      v.logoCrop &&
      typeof (v.logoCrop as any).x === "number" &&
      typeof (v.logoCrop as any).y === "number"
        ? {
            x: Math.max(0, Math.min(100, Number((v.logoCrop as any).x))),
            y: Math.max(0, Math.min(100, Number((v.logoCrop as any).y))),
          }
        : DEFAULT_CONFIG.logoCrop,
    links: Array.isArray(v.links) ? (v.links as OrgPublicProfileConfigV1["links"]) : [],
    sections: Array.isArray(v.sections) ? (v.sections as OrgPublicProfileConfigV1["sections"]) : DEFAULT_CONFIG.sections,
  };
};

export default function AdminOrgPublicProfilePage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const myOrganizations = useQuery(
    api.coreTenant.organizations.myOrganizations,
    shouldQuery ? {} : "skip",
  ) as { _id: string; userRole: string }[] | undefined;

  const myRole =
    myOrganizations?.find((o) => String(o._id) === String(organizationId))?.userRole ?? "";
  const canEdit = myRole === "owner" || myRole === "admin";

  const org = useQuery(
    api.coreTenant.organizations.getOrganizationById,
    shouldQuery && organizationId ? { organizationId } : "skip",
  ) as OrgRow | null | undefined;

  const saveConfig = useMutation(api.coreTenant.organizations.updateOrganizationPublicProfileConfig);
  const updateOrg = useMutation(api.coreTenant.organizations.updateOrganization);

  const [draft, setDraft] = React.useState<OrgPublicProfileConfigV1>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = React.useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = React.useState(false);
  const [logoUrlOverride, setLogoUrlOverride] = React.useState<string | null>(null);
  const [cropOpen, setCropOpen] = React.useState(false);
  const [cropX, setCropX] = React.useState(50);
  const [cropY, setCropY] = React.useState(50);

  React.useEffect(() => {
    if (!org) return;
    setDraft(normalizeConfig(org.publicProfileConfig));
    setLogoUrlOverride(null);
    const nextCrop = normalizeConfig(org.publicProfileConfig).logoCrop ?? DEFAULT_CONFIG.logoCrop;
    setCropX(nextCrop?.x ?? 50);
    setCropY(nextCrop?.y ?? 50);
  }, [org]);

  if (!org) return null;

  return (
    <div className="p-4 md:p-8">
      <OrgPublicProfile
        mode="admin"
        canEdit={canEdit}
        isSaving={isSaving}
        onEditLogoAction={() => {
          if (!canEdit) return;
          setLogoPickerOpen(true);
        }}
        onSaveAction={async () => {
          if (!canEdit) return;
          setIsSaving(true);
          try {
            await saveConfig({ organizationId, config: draft });
          } finally {
            setIsSaving(false);
          }
        }}
        onChangeConfigAction={(next) => setDraft(next)}
        org={{
          _id: org._id,
          name: org.name,
          slug: org.slug,
          description: org.description,
          logoUrl: logoUrlOverride ?? org.logoUrl,
          publicProfileConfig: draft,
        }}
      />

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
          buildCreateArgs={({ storageId, file }: { storageId: string; file: File }) => ({
            organizationId,
            storageId,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            filename: file.name,
          })}
          onSelect={(item: OrganizationMediaRow) => {
            if (!canEdit) return;
            setLogoPickerOpen(false);
            setLogoUrlOverride(item.url);
            setCropOpen(true);

            void (async () => {
              await updateOrg({
                organizationId,
                logo: null,
                logoMediaId: item._id,
              });
            })();
          }}
        />
      ) : null}

      <Dialog
        open={cropOpen}
        onOpenChange={(open) => {
          setCropOpen(open);
        }}
      >
        <DialogContent className="border-white/10 bg-black/90 text-white">
          <DialogHeader>
            <DialogTitle>Crop logo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-white/70">
              Drag (or click) to choose the focal point for the square avatar crop.
            </div>

            <div
              className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/40"
              onPointerDown={(e) => {
                const el = e.currentTarget;
                el.setPointerCapture(e.pointerId);
                const rect = el.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setCropX(Math.max(0, Math.min(100, x)));
                setCropY(Math.max(0, Math.min(100, y)));
              }}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setCropX(Math.max(0, Math.min(100, x)));
                setCropY(Math.max(0, Math.min(100, y)));
              }}
            >
              {(logoUrlOverride ?? org.logoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(logoUrlOverride ?? org.logoUrl) as string}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-95"
                  style={{ objectPosition: `${cropX}% ${cropY}%` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
                  Pick a logo first
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-white/70">
                Horizontal
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cropX}
                  onChange={(e) => setCropX(Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </label>

              <label className="text-xs text-white/70">
                Vertical
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cropY}
                  onChange={(e) => setCropY(Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => setCropOpen(false)}
            >
              Close
            </Button>

            <Button
              type="button"
              className="border-0 bg-orange-600 text-white hover:bg-orange-700"
              disabled={!canEdit || !organizationId}
              onClick={() => {
                if (!canEdit || !organizationId) return;
                const next: OrgPublicProfileConfigV1 = {
                  ...draft,
                  logoCrop: { x: cropX, y: cropY },
                };
                setDraft(next);
                setIsSaving(true);
                void (async () => {
                  try {
                    await saveConfig({ organizationId, config: next });
                    setCropOpen(false);
                  } finally {
                    setIsSaving(false);
                  }
                })();
              }}
            >
              Save crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-24" />
    </div>
  );
}

