"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Check, PencilIcon, Plus, Trash, UserCog, X } from "lucide-react";
import { toast } from "sonner";

// Import EntityList components
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { CopyText } from "@acme/ui/copy-text";
import { EntityList } from "@acme/ui/entity-list/EntityList";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
} from "~/components/admin/AdminLayout";
import { UserForm } from "~/components/admin/UserForm";
import { useTenant } from "~/context/TenantContext";
import { env } from "~/env";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

type UserRow = Record<string, unknown> & {
  _id: Id<"users">;
  _creationTime: number;
  name?: string;
  email: string;
  role?: string;
  username?: string;
  isActive?: boolean;
  tokenIdentifier?: string;
  addresses?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    country: string;
    fullName: string;
    phoneNumber?: string;
    postalCode: string;
    stateOrProvince: string;
  }[];
};

type MembershipRole = "owner" | "admin" | "editor" | "viewer" | "student";

interface OrganizationMemberRow {
  role: MembershipRole;
  isActive: boolean;
  joinedAt: number;
  user: {
    _id: Id<"users">;
    name?: string;
    email: string;
    image?: string;
  };
}

export default function ClientUsersPage() {
  const router = useRouter();
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);

  // State for user form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<Id<"users"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // First get current user to confirm access (avoid running org-scoped queries when unauthorized).
  const me = useQuery(api.core.users.queries.getMe) as
    | { role?: string }
    | null
    | undefined;

  const isMeGlobalAdmin = me?.role === "admin";

  const removeUserFromOrganization = useMutation(
    api.core.organizations.mutations.removeUser,
  );

  const myOrganizations = useQuery(
    api.core.organizations.queries.myOrganizations,
    me ? {} : "skip",
  ) as { _id: Id<"organizations">; userRole?: string }[] | undefined;

  const myOrgRole =
    organizationId && myOrganizations
      ? (myOrganizations.find((o) => o._id === organizationId)?.userRole ??
        null)
      : null;

  const canManageUsers =
    Boolean(me) &&
    Boolean(organizationId) &&
    (isMeGlobalAdmin || myOrgRole === "owner" || myOrgRole === "admin");

  const membersResult = useQuery(
    api.core.organizations.queries.getOrganizationMembers,
    canManageUsers && organizationId ? { organizationId } : "skip",
  ) as OrganizationMemberRow[] | undefined;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (env.NODE_ENV === "production") return;
    let tokenPreview: string | null = null;
    try {
      const raw = localStorage.getItem("convex_token");
      tokenPreview =
        typeof raw === "string" && raw.length > 16
          ? `${raw.slice(0, 8)}…${raw.slice(-8)}`
          : raw;
    } catch {
      tokenPreview = null;
    }

    console.info(
      "[admin/users] auth debug",
      JSON.stringify({
        organizationId: organizationId ?? null,
        tenantSlug: tenant?.slug ?? null,
        convexTokenPresent: Boolean(tokenPreview),
        convexTokenPreview: tokenPreview,
        meType: me === undefined ? "loading" : me === null ? "null" : "object",
        meRole: me?.role ?? null,
        isMeGlobalAdmin,
        myOrganizationsType:
          myOrganizations === undefined ? "loading" : "loaded",
        myOrganizationsCount: Array.isArray(myOrganizations)
          ? myOrganizations.length
          : null,
        myOrgRole,
        canManageUsers,
        membersResultType:
          membersResult === undefined ? "loading/skip" : "loaded",
        membersCount: Array.isArray(membersResult)
          ? membersResult.length
          : null,
      }),
    );
  }, [
    canManageUsers,
    isMeGlobalAdmin,
    me,
    membersResult,
    myOrgRole,
    myOrganizations,
    organizationId,
    tenant,
  ]);

  const allUsers: UserRow[] = (membersResult ?? []).map((m) => ({
    _id: m.user._id,
    _creationTime: m.joinedAt,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    isActive: m.isActive,
  }));

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    router.refresh();
  };

  if (me && !canManageUsers) {
    return (
      <AdminLayout
        title="User Management"
        description="Manage users and roles for this organization."
      >
        <AdminLayoutHeader />
        <AdminLayoutContent>
          <AdminLayoutMain>
            <div className="container py-4">
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
                <X className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="text-muted-foreground">
                  You must be an organization admin to view this page.
                </p>
              </div>
            </div>
          </AdminLayoutMain>
        </AdminLayoutContent>
      </AdminLayout>
    );
  }

  // Define column configurations for EntityList
  const columns: ColumnDefinition<UserRow>[] = [
    {
      id: "user",
      header: "User",
      accessorKey: "name",
      cell: (user: UserRow) => {
        return (
          <div className="flex flex-col">
            <span className="font-medium">{user.name ?? "Unnamed User"}</span>
            {user.username && (
              <span className="text-xs text-blue-600">@{user.username}</span>
            )}
            {user.email && (
              <span className="text-muted-foreground text-xs">
                {user.email}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      cell: (user: UserRow) => {
        return (
          <div className="flex flex-col gap-1">
            <CopyText value={user.email} className="max-w-fit">
              <span className="font-mono text-sm">{user.email}</span>
            </CopyText>
            <CopyText value={user._id} className="max-w-fit">
              <span className="text-muted-foreground text-xs">{user._id}</span>
            </CopyText>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isActive",
      cell: (user: UserRow) => {
        return user.isActive !== false ? (
          <Badge
            variant="outline"
            className="border-green-200 bg-green-50 text-green-700"
          >
            <Check className="mr-1 h-3 w-3" /> Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            <X className="mr-1 h-3 w-3" /> Inactive
          </Badge>
        );
      },
    },
    {
      id: "joined",
      header: "Joined",
      accessorKey: "_creationTime",
      cell: (user: UserRow) => {
        return (
          <span className="text-muted-foreground">
            {user._creationTime
              ? formatDistanceToNow(new Date(user._creationTime), {
                  addSuffix: true,
                })
              : "Unknown"}
          </span>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      cell: (user: UserRow) => {
        const roleConfig = {
          owner: { variant: "default" as const, label: "Owner" },
          admin: { variant: "default" as const, label: "Admin" },
          editor: { variant: "secondary" as const, label: "Editor" },
          viewer: { variant: "outline" as const, label: "Viewer" },
          student: { variant: "outline" as const, label: "Student" },
        };
        const roleKey = typeof user.role === "string" ? user.role : "viewer";
        const config =
          roleKey === "owner" ||
          roleKey === "admin" ||
          roleKey === "editor" ||
          roleKey === "viewer" ||
          roleKey === "student"
            ? roleConfig[roleKey]
            : roleConfig.viewer;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: "address",
      header: "Address",
      accessorKey: "addresses",
      cell: (user: UserRow) => {
        const address = user.addresses?.[0];
        if (!address) {
          return <span className="text-muted-foreground">No address</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm">{address.fullName}</span>
            <span className="text-muted-foreground text-xs">
              {address.city}, {address.stateOrProvince} {address.postalCode}
            </span>
            {address.phoneNumber && (
              <span className="text-muted-foreground text-xs">
                {address.phoneNumber}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<UserRow>[] = [
    {
      id: "name",
      label: "Name",
      type: "text",
      field: "name",
    },
    {
      id: "username",
      label: "Username",
      type: "text",
      field: "username",
    },
    {
      id: "email",
      label: "Email",
      type: "text",
      field: "email",
    },
    {
      id: "role",
      label: "Role",
      type: "select",
      field: "role",
      options: [
        { label: "Owner", value: "owner" },
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Viewer", value: "viewer" },
        { label: "Student", value: "student" },
      ],
    },
    {
      id: "isActive",
      label: "Status",
      type: "boolean",
      field: "isActive",
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<UserRow>[] = [
    {
      id: "edit",
      label: "Edit User",
      icon: <PencilIcon className="h-4 w-4" />,
      onClick: (user) => {
        router.push(`/admin/user/${user._id}`);
      },
    },
    {
      id: "view",
      label: "View Details",
      onClick: (user) => router.push(`/admin/user/${user._id}`),
      variant: "outline",
    },
    {
      id: "delete",
      label: "Remove from organization",
      icon: <Trash className="h-4 w-4" />,
      variant: "destructive",
      onClick: (user) => {
        setDeleteUserId(user._id);
      },
    },
  ];

  return (
    <AdminLayout title="User Management" description="Manage users and roles.">
      <AdminLayoutHeader />
      <AdminLayoutContent>
        <AdminLayoutMain>
          <div className="container py-4">
            <EntityList<UserRow>
              data={allUsers}
              columns={columns}
              filters={filters}
              isLoading={canManageUsers && membersResult === undefined}
              title="User Management"
              description="Manage users and their roles in this organization"
              actions={
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              }
              defaultViewMode="list"
              viewModes={["list"]}
              entityActions={entityActions}
              emptyState={
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
                  <UserCog className="text-muted-foreground mb-4 h-12 w-12" />
                  <h3 className="text-lg font-medium">No Users Found</h3>
                  <p className="text-muted-foreground">
                    No users in this organization yet
                  </p>
                  <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First User
                  </Button>
                </div>
              }
            />

            {/* User Form Dialog */}
            <UserForm
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              userId={undefined}
              onSuccess={handleFormSuccess}
              mode="dialog"
            />

            <AlertDialog
              open={Boolean(deleteUserId)}
              onOpenChange={(open) => {
                if (!open) {
                  setDeleteUserId(null);
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Remove user from organization?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the user from the current organization. It does
                    not delete the user from Clerk and does not affect their
                    membership in other organizations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (!deleteUserId) return;
                      if (!organizationId) return;
                      setIsDeleting(true);
                      try {
                        await removeUserFromOrganization({
                          organizationId,
                          userId: deleteUserId,
                        });
                        toast.success("User removed");
                        setDeleteUserId(null);
                        router.refresh();
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Failed to delete user",
                        );
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </AdminLayoutMain>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
