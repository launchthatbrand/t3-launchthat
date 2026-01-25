/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { ImageCropper } from "@acme/ui";
import { MediaLibraryDialog } from "launchthat-plugin-core-tenant/frontend";
import { OrgPublicProfile } from "~/components/publicProfiles/OrgPublicProfile";
import type { OrgPublicProfileConfigV1 } from "~/components/publicProfiles/OrgPublicProfile";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { useParams } from "next/navigation";

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

interface FileWithPreview {
  preview: string;
}

const DEFAULT_CONFIG: OrgPublicProfileConfigV1 = {
  version: "v1",
  heroCtas: [{ id: "join", label: "Join TraderLaunchpad", url: "/join", variant: "primary" }],
  logoCrop: { x: 50, y: 50 },
  excerpt: "",
  bio: "",
  links: [],
  sections: [
    { id: "hero", kind: "hero", enabled: true },
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    excerpt: typeof v.excerpt === "string" ? v.excerpt : DEFAULT_CONFIG.excerpt,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    bio: typeof v.bio === "string" ? v.bio : DEFAULT_CONFIG.bio,
    links: Array.isArray(v.links) ? (v.links as OrgPublicProfileConfigV1["links"]) : [],
    // Remove deprecated "about" section entirely.
    sections: (
      Array.isArray(v.sections)
        ? (v.sections as OrgPublicProfileConfigV1["sections"])
        : DEFAULT_CONFIG.sections
    ).filter((s) => (s as any)?.kind !== "about"),
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
  const generateUploadUrl = useMutation(api.coreTenant.organizations.generateOrganizationMediaUploadUrl);
  const createOrgMedia = useMutation(api.coreTenant.organizations.createOrganizationMedia);

  const [draft, setDraft] = React.useState<OrgPublicProfileConfigV1>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSavingName, setIsSavingName] = React.useState(false);
  const [nameDialogOpen, setNameDialogOpen] = React.useState(false);
  const [draftName, setDraftName] = React.useState("");
  const [logoPickerOpen, setLogoPickerOpen] = React.useState(false);
  const [logoUrlOverride, setLogoUrlOverride] = React.useState<string | null>(null);
  const [logoPreviewOpen, setLogoPreviewOpen] = React.useState(false);
  const [pendingSelectedMedia, setPendingSelectedMedia] = React.useState<OrganizationMediaRow | null>(null);
  const [libraryInitialSelectedId, setLibraryInitialSelectedId] = React.useState<string | null>(null);
  const [libraryFinalizeOnSelect, setLibraryFinalizeOnSelect] = React.useState(false);
  const [cropOpen, setCropOpen] = React.useState(false);
  const [logoCropFile, setLogoCropFile] = React.useState<FileWithPreview | null>(null);
  const hasInitializedDraftRef = React.useRef(false);

  const dataUrlToFile = React.useCallback((dataUrl: string, filename: string) => {
    const [header, base64] = dataUrl.split(",", 2);
    if (!header || !base64) return null;
    const match = /data:(.*?);base64/.exec(header);
    const mime = match?.[1] ?? "image/png";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  }, []);

  React.useEffect(() => {
    if (!cropOpen) setLogoCropFile(null);
  }, [cropOpen]);

  const handleFinalizeLogo = React.useCallback(async (mediaId: string) => {
    if (!canEdit || !organizationId) return;
    try {
      setIsSaving(true);
      await updateOrg({
        organizationId,
        logo: null,
        logoMediaId: mediaId,
      });
    } finally {
      setIsSaving(false);
      setLogoUrlOverride(null);
    }
  }, [canEdit, organizationId, updateOrg]);

  React.useEffect(() => {
    if (!org) return;
    // Avoid clobbering local edits when org refetches (e.g. while changing logo / cropping).
    const isEditing = cropOpen || logoPickerOpen || isSaving;
    if (hasInitializedDraftRef.current && isEditing) return;

    setDraft(normalizeConfig(org.publicProfileConfig));
    if (!nameDialogOpen) setDraftName(org.name);
    setLogoUrlOverride(null);
    setLogoCropFile(null);
    hasInitializedDraftRef.current = true;
  }, [org, cropOpen, logoPickerOpen, isSaving, nameDialogOpen]);

  if (!org) return null;

  const publicBaseHref = `/org/${encodeURIComponent(org.slug)}`;
  const tabs = [
    { label: "Dashboard", href: publicBaseHref, isActive: false },
    { label: "Trade Ideas", href: `${publicBaseHref}/tradeideas`, isActive: false },
    { label: "Orders", href: `${publicBaseHref}/orders`, isActive: false },
  ];

  return (
    <div>
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="border-white/10 bg-black/90 text-white">
          <DialogHeader>
            <DialogTitle>Edit organization name</DialogTitle>
          </DialogHeader>
          <label className="block text-sm text-white/70">
            Name
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Organization name"
            />
          </label>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                disabled={isSavingName}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="h-10 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
              disabled={isSavingName || !draftName.trim()}
              onClick={async () => {
                if (!canEdit || !organizationId) return;
                setIsSavingName(true);
                try {
                  await updateOrg({ organizationId, name: draftName.trim() });
                  setNameDialogOpen(false);
                } finally {
                  setIsSavingName(false);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OrgPublicProfile
        mode="admin"
        canEdit={canEdit}
        isSaving={isSaving}
        tabs={tabs}
        onEditOrgNameAction={() => {
          if (!canEdit) return;
          setDraftName(org.name);
          setNameDialogOpen(true);
        }}
        onEditLogoAction={() => {
          if (!canEdit) return;
          setLibraryFinalizeOnSelect(false);
          setLibraryInitialSelectedId(null);
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
          initialSelectedId={libraryInitialSelectedId}
          selectLabel="Select Image"
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
            if (libraryFinalizeOnSelect) {
              // Final step after cropping: the library is reopened with the cropped image preselected,
              // and the user explicitly confirms by clicking "Select Image".
              setLogoPickerOpen(false);
              void handleFinalizeLogo(item._id);
              setLibraryFinalizeOnSelect(false);
              setLibraryInitialSelectedId(null);
              return;
            }

            // Step 1: pick from media library -> step 2 preview dialog (crop or save).
            setLogoPickerOpen(false);
            setPendingSelectedMedia(item);
            setLogoPreviewOpen(true);
          }}
        />
      ) : null}

      <Dialog open={logoPreviewOpen} onOpenChange={setLogoPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review logo</DialogTitle>
            <DialogDescription>
              Crop the image or save it as-is. Cropping creates a new media item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-border/60 bg-muted/10">
              {pendingSelectedMedia?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pendingSelectedMedia.url}
                  alt={pendingSelectedMedia.filename ?? "Selected image"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
                  No preview available
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPendingSelectedMedia(null);
                  setLogoPreviewOpen(false);
                  setLogoPickerOpen(true);
                }}
              >
                Back to library
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="outline"
              disabled={!pendingSelectedMedia?.url}
              onClick={() => {
                const url = pendingSelectedMedia?.url ?? null;
                if (!url) return;
                setLogoCropFile({ preview: url });
                setCropOpen(true);
              }}
            >
              Crop
            </Button>
            <Button
              type="button"
              disabled={!pendingSelectedMedia?._id}
              onClick={() => {
                const id = pendingSelectedMedia?._id ?? "";
                if (!id) return;
                void handleFinalizeLogo(id);
                setPendingSelectedMedia(null);
                setLogoPreviewOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {logoCropFile ? (
        <ImageCropper
          dialogOpen={cropOpen}
          setDialogOpen={setCropOpen}
          selectedFile={logoCropFile}
          setSelectedFile={setLogoCropFile}
          showTrigger={false}
          cropButtonLabel="Crop Image"
          onCropped={(result) => {
            if (!canEdit || !organizationId) return;
            const maybeDataUrl = (result as { dataUrl?: string }).dataUrl;
            if (!maybeDataUrl) return;

            // Show cropped result immediately while we upload it.
            setLogoUrlOverride(maybeDataUrl);

            void (async () => {
              try {
                const file = dataUrlToFile(maybeDataUrl, `org-logo-cropped-${Date.now()}.png`);
                if (!file) return;

                const uploadUrl = await generateUploadUrl({ organizationId });
                const uploadRes = await fetch(uploadUrl, {
                  method: "POST",
                  headers: { "Content-Type": file.type },
                  body: file,
                });
                if (!uploadRes.ok) {
                  throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
                }
                const uploadJson = (await uploadRes.json()) as { storageId?: string };
                const storageId = uploadJson.storageId;
                if (!storageId) throw new Error("Upload response missing storageId");

                const created = await createOrgMedia({
                  organizationId,
                  // Convex expects Id<"_storage">; upload returns a string id.
                  storageId: storageId as unknown as never,
                  contentType: file.type || "application/octet-stream",
                  size: file.size,
                  filename: file.name,
                });
                const mediaId = (created as { mediaId?: string }).mediaId;
                if (!mediaId) throw new Error("createOrganizationMedia missing mediaId");

                // Close crop + preview, return to library with the new media preselected.
                setCropOpen(false);
                setLogoPreviewOpen(false);
                setPendingSelectedMedia(null);
                setLibraryInitialSelectedId(mediaId);
                setLibraryFinalizeOnSelect(true);
                setLogoPickerOpen(true);
              } catch (err) {
                console.error("[AdminOrgPublicProfile] crop upload error", err);
              }
            })();
          }}
        />
      ) : null}

      <div className="h-24" />
    </div>
  );
}

