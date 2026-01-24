"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import * as convexReact from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Button } from "@acme/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { MediaLibraryDialog } from "launchthat-plugin-core-tenant/frontend";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import { api } from "@convex-config/_generated/api";
import { cn } from "~/lib/utils";

const {
  useConvexAuth,
  useMutation: useConvexMutation,
  useQuery: useConvexQuery,
} = convexReact;

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

interface OrgMemberRow extends Record<string, unknown> {
  userId: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
  isActive: boolean;
}

interface OrgInviteRow extends Record<string, unknown> {
  _id: string;
  email: string;
  role: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  redeemedAt?: number;
  revokedAt?: number;
}

interface CreateInviteResult {
  inviteId: string;
  token: string;
}

const orgTabs: { id: "general" | "members"; label: string }[] = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
];

export default function AdminSettingsOrganizationPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const myOrganizations = useConvexQuery(
    api.coreTenant.organizations.myOrganizations,
    shouldQuery ? {} : "skip",
  ) as
    | { _id: string; userRole: string }[]
    | undefined;

  const myRole =
    myOrganizations?.find((o) => String(o._id) === String(organizationId))?.userRole ?? "";
  const isOrgAdmin = myRole === "owner" || myRole === "admin";

  const [activeTab, setActiveTab] = React.useState<"general" | "members">("general");

  const org = useConvexQuery(
    api.coreTenant.organizations.getOrganizationById,
    organizationId ? { organizationId } : "skip",
  ) as Org | null | undefined;

  const updateOrg = useConvexMutation(api.coreTenant.organizations.updateOrganization);
  const [draftName, setDraftName] = React.useState("");
  const [draftSlug, setDraftSlug] = React.useState("");
  const [draftLogoMediaId, setDraftLogoMediaId] = React.useState<string | null>(null);
  const [draftLogoPreviewUrl, setDraftLogoPreviewUrl] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = React.useState(false);

  // Members / invites (org-admin only server-side).
  const members = useConvexQuery(
    api.traderlaunchpad.queries.listOrgUsers,
    shouldQuery && organizationId ? { organizationId, limit: 500 } : "skip",
  ) as OrgMemberRow[] | undefined;

  const invites = useConvexQuery(
    api.traderlaunchpad.queries.listOrgUserInvites,
    shouldQuery && organizationId ? { organizationId, includeExpired: false, limit: 200 } : "skip",
  ) as OrgInviteRow[] | undefined;

  const createInvite = useConvexMutation(api.traderlaunchpad.mutations.createOrgUserInvite);
  const revokeInvite = useConvexMutation(api.traderlaunchpad.mutations.revokeOrgUserInvite);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("viewer");
  const [createdLink, setCreatedLink] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!org) return;
    setDraftName(org.name);
    setDraftSlug(org.slug);
    setDraftLogoMediaId(org.logoMediaId ?? null);
    setDraftLogoPreviewUrl(null);
  }, [org]);

  const canSave = Boolean(organizationId) && draftName.trim().length > 0 && !isSaving;

  return (
    <div className="space-y-6">
      <div className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
        {orgTabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                isActive && "bg-background dark:text-foreground dark:border-input dark:bg-input/30 shadow-sm",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "members" ? (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b p-4">
            <CardTitle className="text-base">Members</CardTitle>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button disabled={!isOrgAdmin} className="border-0 bg-orange-600 text-white hover:bg-orange-700">
                  Invite user
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-black/90 text-white">
                <DialogHeader>
                  <DialogTitle>Invite user to organization</DialogTitle>
                </DialogHeader>

                {!isOrgAdmin ? (
                  <div className="text-sm text-white/70">
                    Only organization admins can invite members.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmail" className="text-white/70">
                        Email
                      </Label>
                      <Input
                        id="inviteEmail"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="border-white/10 bg-black/50 text-white placeholder:text-white/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70">Role</Label>
                      <div className="flex flex-wrap gap-2">
                        {["viewer", "student"].map((r) => (
                          <Button
                            key={r}
                            type="button"
                            variant={inviteRole === r ? "default" : "outline"}
                            className={inviteRole === r ? "bg-white/10 text-white" : "border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"}
                            onClick={() => setInviteRole(r)}
                          >
                            {r}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {createdLink ? (
                      <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                        <div className="text-xs font-medium text-white/70">Invite link</div>
                        <div className="mt-2 break-all text-xs text-white/70">{createdLink}</div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                            onClick={() => {
                              void navigator.clipboard.writeText(createdLink);
                            }}
                          >
                            Copy
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                            onClick={() => setCreatedLink(null)}
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    onClick={() => setInviteOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    disabled={!isOrgAdmin || !organizationId || !inviteEmail.trim()}
                    className="border-0 bg-orange-600 text-white hover:bg-orange-700"
                    onClick={() => {
                      void (async () => {
                        if (!organizationId) return;
                        const email = inviteEmail.trim().toLowerCase();
                        if (!email) return;
                        const res = (await createInvite({
                          organizationId,
                          email,
                          role: inviteRole,
                          expiresInDays: 7,
                        })) as unknown as CreateInviteResult;
                        const token = typeof res.token === "string" ? res.token : "";
                        const link = token
                          ? `${window.location.origin}/join?invite=${encodeURIComponent(token)}`
                          : "";
                        setCreatedLink(link || null);
                        setInviteEmail("");
                        setInviteRole("viewer");
                      })();
                    }}
                  >
                    Create invite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="space-y-6 p-4">
            <div>
              <div className="mb-2 text-sm font-semibold">Member directory</div>
              <EntityList<OrgMemberRow>
                data={Array.isArray(members) ? members : []}
                columns={[
                  {
                    id: "user",
                    header: "User",
                    accessorKey: "userId",
                    cell: (u: OrgMemberRow) => (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{u.name ?? u.email ?? "Member"}</div>
                        <div className="text-muted-foreground text-xs">{u.email ?? "—"}</div>
                        <div className="text-muted-foreground text-xs font-mono">{u.userId}</div>
                      </div>
                    ),
                    sortable: true,
                  },
                  {
                    id: "role",
                    header: "Role",
                    accessorKey: "role",
                    cell: (u: OrgMemberRow) => <Badge variant="secondary">{u.role || "viewer"}</Badge>,
                    sortable: true,
                  },
                  {
                    id: "active",
                    header: "Active",
                    accessorKey: "isActive",
                    cell: (u: OrgMemberRow) => (
                      <Badge variant={u.isActive ? "default" : "secondary"}>
                        {u.isActive ? "active" : "inactive"}
                      </Badge>
                    ),
                    sortable: true,
                  },
                ] satisfies ColumnDefinition<OrgMemberRow>[]}
                isLoading={members === undefined}
                defaultViewMode="list"
                viewModes={["list"]}
                enableSearch={true}
                getRowId={(u: OrgMemberRow) => u.userId}
                emptyState={
                  <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
                    <div className="text-lg font-medium">No members</div>
                    <div className="text-muted-foreground mt-1 text-sm">
                      No members found (or you don’t have permission to view members).
                    </div>
                  </div>
                }
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold">Invites</div>
              <EntityList<OrgInviteRow>
                data={Array.isArray(invites) ? invites : []}
                columns={[
                  {
                    id: "email",
                    header: "Email",
                    accessorKey: "email",
                    cell: (r: OrgInviteRow) => (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{r.email}</div>
                        <div className="text-muted-foreground text-xs">
                          Expires {new Date(r.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                    ),
                    sortable: true,
                  },
                  {
                    id: "role",
                    header: "Role",
                    accessorKey: "role",
                    cell: (r: OrgInviteRow) => <Badge variant="secondary">{r.role}</Badge>,
                    sortable: true,
                  },
                  {
                    id: "status",
                    header: "Status",
                    accessorKey: "redeemedAt",
                    cell: (r: OrgInviteRow) => {
                      if (typeof r.revokedAt === "number") return <Badge variant="secondary">revoked</Badge>;
                      if (typeof r.redeemedAt === "number") return <Badge variant="default">accepted</Badge>;
                      return <Badge variant="secondary">pending</Badge>;
                    },
                    sortable: true,
                  },
                ] satisfies ColumnDefinition<OrgInviteRow>[]}
                isLoading={invites === undefined}
                defaultViewMode="list"
                viewModes={["list"]}
                enableSearch={true}
                entityActions={
                  [
                    {
                      id: "copy",
                      label: "Copy invite link",
                      variant: "outline",
                      onClick: (r: OrgInviteRow) => {
                        void (async () => {
                          const link = `${window.location.origin}/join?invite=${encodeURIComponent(r.token)}`;
                          await navigator.clipboard.writeText(link);
                        })();
                      },
                    },
                    {
                      id: "revoke",
                      label: "Revoke",
                      variant: "destructive",
                      onClick: (r: OrgInviteRow) => {
                        void (async () => {
                          if (!organizationId) return;
                          await revokeInvite({ organizationId, inviteId: r._id });
                        })();
                      },
                    },
                  ] satisfies EntityAction<OrgInviteRow>[]
                }
                getRowId={(r: OrgInviteRow) => r._id}
                emptyState={
                  <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
                    <div className="text-lg font-medium">No invites</div>
                    <div className="text-muted-foreground mt-1 text-sm">
                      Create an invite to onboard new members.
                    </div>
                  </div>
                }
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "general" ? (
        <>
          <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
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
                  <div className="relative mt-2 h-32 w-full overflow-hidden rounded-md border bg-muted/20">
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
          buildCreateArgs={({ storageId, file }: { storageId: string; file: File }) => ({
            organizationId,
            storageId,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            filename: file.name,
          })}
          onSelect={(item: OrganizationMediaRow) => {
            setDraftLogoMediaId(item._id);
            setDraftLogoPreviewUrl(item.url);
          }}
        />
      ) : null}
        </>
      ) : null}
    </div>
  );
}

