"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { OrganizationMember } from "@/convex/core/organizations/types";
import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { LoadingSpinner } from "launchthat-plugin-calendar";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Crown,
  Globe,
  Settings,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import type {
  ColumnDefinition,
  EntityAction,
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
  AlertDialogTrigger,
} from "@acme/ui/alert-dialog";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";

import { OrganizationDomainsCard } from "../_components/OrganizationDomainsCard";
import { OrganizationForm } from "../_components/OrganizationForm";

type OrganizationMeta = Doc<"organizations"> & {
  memberCount?: number;
  userRole?: "owner" | "admin" | "editor" | "viewer" | "student";
  customDomain?: string;
  customDomainStatus: "unconfigured" | "pending" | "verified" | "error";
  customDomainRecords?: { type: string; name: string; value: string }[];
};

const MEMBER_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
  { value: "student", label: "Student" },
] as const;

export default function OrganizationDetailPage() {
  const params = useParams<{ organizationId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = params.organizationId as Id<"organizations">;

  // State
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [newMemberEmail, setNewMemberEmail] = React.useState("");
  const [newMemberRole, setNewMemberRole] = React.useState<
    "admin" | "editor" | "viewer" | "student"
  >("viewer");
  const [isAddingMember, setIsAddingMember] = React.useState(false);
  const [roleUpdatingUserId, setRoleUpdatingUserId] = React.useState<
    string | null
  >(null);
  const [removingUserId, setRemovingUserId] = React.useState<string | null>(
    null,
  );

  // Queries
  const organization = useQuery(api.core.organizations.queries.getById, {
    organizationId,
  });
  const plans = useQuery(api.core.organizations.queries.getAssignableOrgPlans, {});
  const members = useQuery(
    api.core.organizations.queries.getOrganizationMembers,
    {
      organizationId,
    },
  );

  // Mutations
  const deleteOrganization = useMutation(
    api.core.organizations.mutations.deleteOrganization,
  );
  const addOrganizationMember = useMutation(
    api.core.organizations.mutations.addUserByEmail,
  );
  const updateMemberRole = useMutation(
    api.core.organizations.mutations.updateUserRole,
  );
  const removeOrganizationMember = useMutation(
    api.core.organizations.mutations.removeUser,
  );

  // Handlers
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteOrganization({ organizationId });
      toast.success("Organization deleted successfully");
      router.push("/admin/settings/organizations");
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("Failed to delete organization");
    } finally {
      setIsDeleting(false);
    }
  };
  const searchParamsString = searchParams.toString();
  const activeTab = React.useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    const rawTab = params.get("tab") ?? "overview";
    const allowedTabs = [
      "overview",
      "settings",
      "domains",
      "members",
      "danger",
    ] as const;
    return allowedTabs.includes(rawTab as (typeof allowedTabs)[number])
      ? rawTab
      : "overview";
  }, [searchParamsString]);

  const handleAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = newMemberEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Please enter an email address");
      return;
    }
    try {
      setIsAddingMember(true);
      await addOrganizationMember({
        organizationId,
        email: trimmedEmail,
        role: newMemberRole,
      });
      toast.success("Member added successfully");
      setNewMemberEmail("");
      setNewMemberRole("viewer");
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add member",
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRoleChange = React.useCallback(
    async (
      userId: Id<"users">,
      role: (typeof MEMBER_ROLE_OPTIONS)[number]["value"],
    ) => {
      try {
        setRoleUpdatingUserId(userId);
        await updateMemberRole({
          organizationId,
          userId,
          role,
        });
        toast.success("Member role updated");
      } catch (error) {
        console.error("Error updating member role:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update role",
        );
      } finally {
        setRoleUpdatingUserId(null);
      }
    },
    [organizationId, updateMemberRole],
  );

  const handleRemoveMember = React.useCallback(
    async (userId: Id<"users">) => {
      try {
        setRemovingUserId(userId);
        await removeOrganizationMember({
          organizationId,
          userId,
        });
        toast.success("Member removed");
      } catch (error) {
        console.error("Error removing member:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to remove member",
        );
      } finally {
        setRemovingUserId(null);
      }
    },
    [organizationId, removeOrganizationMember],
  );

  type MemberRow = OrganizationMember & Record<string, unknown>;

  const memberList = React.useMemo<MemberRow[]>(
    () =>
      (Array.isArray(members) ? (members as OrganizationMember[]) : []) as
        | MemberRow[]
        | [],
    [members],
  );
  const memberColumns = React.useMemo<ColumnDefinition<MemberRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (item: MemberRow) => (
          <div className="font-medium">{item.user.name ?? "Unnamed"}</div>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: (item: MemberRow) => item.user.email,
      },
      {
        id: "role",
        header: "Role",
        cell: (member: MemberRow) => {
          const isOwner = member.role === "owner";
          return (
            <Select
              value={member.role}
              onValueChange={(value) =>
                handleRoleChange(
                  member.userId,
                  value as (typeof MEMBER_ROLE_OPTIONS)[number]["value"],
                )
              }
              disabled={isOwner || roleUpdatingUserId === member.userId}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isOwner ? <SelectItem value="owner">Owner</SelectItem> : null}
                {MEMBER_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      },
    ],
    [handleRoleChange, roleUpdatingUserId],
  );
  const memberActions = React.useMemo<EntityAction<MemberRow>[]>(
    () => [
      {
        id: "remove",
        label: "Remove",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: (member) => {
          void handleRemoveMember(member.userId);
        },
        variant: "ghost",
        isDisabled: (member) =>
          member.role === "owner" || removingUserId === member.userId,
      },
    ],
    [handleRemoveMember, removingUserId],
  );

  if (organization === undefined) {
    return <LoadingSpinner />;
  }

  if (organization === null) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Building2 className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">Organization not found</h3>
          <p className="text-muted-foreground mb-4">
            The requested organization could not be found.
          </p>
          <Button onClick={() => router.push("/admin/settings/organizations")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  const planList: {
    _id: string;
    name?: string;
    displayName: string;
    priceMonthly: number;
  }[] = Array.isArray(plans)
    ? (plans as {
        _id: string;
        name?: string;
        displayName: string;
        priceMonthly: number;
      }[])
    : [];
  const org = organization as OrganizationMeta;
  const freePlanId = planList.find((p) => p.name === "free")?._id;
  const effectivePlanId = org.planId ?? freePlanId;
  const currentPlan = planList.find((plan) =>
    effectivePlanId ? plan._id === effectivePlanId : false,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{org.name}</h1>
        <p className="text-muted-foreground">
          Organization details and settings
        </p>
      </div>

      {activeTab === "overview" ? (
        <div className="mt-6 space-y-6">
          {/* Organization Overview Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Basic Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Organization
                </CardTitle>
                <Building2 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organization.name}</div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {organization.slug}
                </p>
              </CardContent>
            </Card>

            {/* Plan Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Plan
                </CardTitle>
                <CreditCard className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentPlan?.displayName ?? "No Plan"}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {currentPlan
                    ? `$${(currentPlan.priceMonthly / 100).toFixed(2)}/mo`
                    : "Not assigned"}
                </p>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Settings className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {organization.subscriptionStatus}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Subscription status
                </p>
              </CardContent>
            </Card>

            {/* Owner */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Owner</CardTitle>
                <Crown className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {organization.ownerId ? "Assigned" : "No Owner"}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Organization owner
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Organization Details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Settings (read-only badges; editing lives in Settings tab) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Current Settings
                </CardTitle>
                <CardDescription>
                  Current configuration snapshot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Visibility</span>
                  <div className="flex items-center gap-2">
                    <Globe className="text-muted-foreground h-4 w-4" />
                    <Badge
                      variant={organization.isPublic ? "default" : "secondary"}
                    >
                      {organization.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Self Registration</span>
                  <div className="flex items-center gap-2">
                    <UserPlus className="text-muted-foreground h-4 w-4" />
                    <Badge
                      variant={
                        organization.allowSelfRegistration
                          ? "default"
                          : "secondary"
                      }
                    >
                      {organization.allowSelfRegistration
                        ? "Enabled"
                        : "Disabled"}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Description</span>
                  <span className="text-muted-foreground text-sm">
                    {organization.description ?? "No description"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Organization Information
                </CardTitle>
                <CardDescription>Timestamps and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm">
                    {new Date(organization._creationTime).toLocaleDateString()}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm">
                    {new Date(organization.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Organization ID</span>
                  <span className="bg-muted rounded px-2 py-1 font-mono text-xs">
                    {organization._id}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Slug</span>
                  <span className="font-mono text-sm">{organization.slug}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "settings" ? (
        <div className="mt-6 space-y-6">
          <OrganizationForm
            organizationId={organizationId}
            mode="inline"
            submitButtonText="Save changes"
          />
        </div>
      ) : null}

      {activeTab === "domains" ? (
        <div className="mt-6 space-y-6">
          <OrganizationDomainsCard organizationId={organizationId} />
        </div>
      ) : null}

      {activeTab === "members" ? (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Organization Members
                  </CardTitle>
                  <CardDescription>
                    Manage team members who can access this organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                onSubmit={handleAddMember}
                className="grid gap-4 md:grid-cols-[1fr,200px,auto]"
              >
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newMemberEmail}
                  onChange={(event) => setNewMemberEmail(event.target.value)}
                  required
                />
                <Select
                  value={newMemberRole}
                  onValueChange={(value) =>
                    setNewMemberRole(
                      value as (typeof MEMBER_ROLE_OPTIONS)[number]["value"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isAddingMember}>
                  {isAddingMember ? "Adding..." : "Add Member"}
                </Button>
              </form>
              <Separator />
              {members === undefined ? (
                <div className="py-8 text-center">
                  <LoadingSpinner />
                </div>
              ) : memberList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No members yet. Add someone using their email address.
                </p>
              ) : (
                <EntityList
                  data={memberList}
                  columns={memberColumns}
                  entityActions={memberActions}
                  enableFooter={false}
                  viewModes={["list"]}
                  defaultViewMode="list"
                  enableSearch
                  className="p-0"
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "danger" ? (
        <div className="mt-6 space-y-6">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Destructive actions for this organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete organization
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{org.name}"? This action
                      cannot be undone and will remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Organization
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
