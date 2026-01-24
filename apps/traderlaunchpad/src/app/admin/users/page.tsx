"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Search } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";
import { api } from "@convex-config/_generated/api";

import { useTenant } from "~/context/TenantContext";

interface OrgUserRow {
  userId: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
  isActive: boolean;
}

interface OrgInviteRow {
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

const ROLE_LABELS: { id: string; label: string }[] = [
  { id: "viewer", label: "Viewer" },
  { id: "student", label: "Student" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const tenant = useTenant();
  const isOrgMode = Boolean(tenant && tenant.slug !== "platform");
  const organizationId = tenant?._id ?? "";

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading && Boolean(organizationId) && isOrgMode;

  const members = useQuery(
    api.traderlaunchpad.queries.listOrgUsers,
    shouldQuery ? { organizationId, limit: 500 } : "skip",
  ) as OrgUserRow[] | undefined;

  const invites = useQuery(
    api.traderlaunchpad.queries.listOrgUserInvites,
    shouldQuery ? { organizationId, includeExpired: false, limit: 200 } : "skip",
  ) as OrgInviteRow[] | undefined;

  const createInvite = useMutation(api.traderlaunchpad.mutations.createOrgUserInvite);
  const revokeInvite = useMutation(api.traderlaunchpad.mutations.revokeOrgUserInvite);

  React.useEffect(() => {
    if (!tenant) return;
    if (tenant.slug === "platform") {
      router.replace("/admin/dashboard");
    }
  }, [router, tenant]);

  if (!tenant || !isOrgMode) return null;

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("viewer");
  const [saving, setSaving] = React.useState(false);
  const [createdLink, setCreatedLink] = React.useState<string | null>(null);

  const memberRows = React.useMemo(() => (Array.isArray(members) ? members : []), [members]);
  const inviteRows = React.useMemo(() => (Array.isArray(invites) ? invites : []), [invites]);

  const memberColumns = React.useMemo<ColumnDefinition<OrgUserRow>[]>(() => {
    return [
      {
        id: "user",
        header: "User",
        accessorKey: "userId",
        cell: (u: OrgUserRow) => (
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
        cell: (u: OrgUserRow) => (
          <Badge variant="secondary">{u.role || "viewer"}</Badge>
        ),
        sortable: true,
      },
      {
        id: "active",
        header: "Active",
        accessorKey: "isActive",
        cell: (u: OrgUserRow) => (
          <Badge variant={u.isActive ? "default" : "secondary"}>
            {u.isActive ? "active" : "inactive"}
          </Badge>
        ),
        sortable: true,
      },
    ];
  }, []);

  const inviteColumns = React.useMemo<ColumnDefinition<OrgInviteRow>[]>(() => {
    return [
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
    ];
  }, []);

  const inviteActions = React.useMemo<EntityAction<OrgInviteRow>[]>(() => {
    return [
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
            if (saving) return;
            setSaving(true);
            try {
              await revokeInvite({ organizationId, inviteId: r._id });
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ];
  }, [organizationId, revokeInvite, saving]);

  const handleCreateInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (saving) return;
    setSaving(true);
    try {
      const res = (await createInvite({
        organizationId,
        email,
        role: inviteRole,
        expiresInDays: 7,
      })) as unknown as CreateInviteResult;
      const token = typeof res?.token === "string" ? res.token : "";
      const link = token ? `${window.location.origin}/join?invite=${encodeURIComponent(token)}` : "";
      setCreatedLink(link || null);
      setInviteEmail("");
      setInviteRole("viewer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage members for <span className="font-semibold">{tenant.name}</span>. Invites are org-scoped and do not search the global user directory.
          </p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="border-0 bg-orange-600 text-white hover:bg-orange-700">
              Invite user
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-black/90 text-white">
            <DialogHeader>
              <DialogTitle>Invite user to organization</DialogTitle>
            </DialogHeader>

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
                  {ROLE_LABELS.map((r) => (
                    <Button
                      key={r.id}
                      type="button"
                      variant={inviteRole === r.id ? "default" : "outline"}
                      className={inviteRole === r.id ? "bg-white/10 text-white" : "border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"}
                      onClick={() => setInviteRole(r.id)}
                    >
                      {r.label}
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
                      onClick={async () => {
                        await navigator.clipboard.writeText(createdLink);
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

            <DialogFooter>
              <Button
                variant="outline"
                className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => setInviteOpen(false)}
              >
                Close
              </Button>
              <Button
                className="border-0 bg-orange-600 text-white hover:bg-orange-700"
                disabled={saving}
                onClick={handleCreateInvite}
              >
                Create invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EntityList<OrgUserRow>
            data={memberRows}
            columns={memberColumns}
            isLoading={members === undefined}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            getRowId={(u: OrgUserRow) => u.userId}
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <Search className="text-muted-foreground h-5 w-5" />
                <div className="mt-2 text-lg font-medium">No members</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  No users are currently in this organization.
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-base">Invites</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EntityList<OrgInviteRow>
            data={inviteRows}
            columns={inviteColumns}
            isLoading={invites === undefined}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            entityActions={inviteActions}
            getRowId={(r: OrgInviteRow) => r._id}
            emptyState={
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <Search className="text-muted-foreground h-5 w-5" />
                <div className="mt-2 text-lg font-medium">No invites</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  Create an invite to onboard new users to this organization.
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

