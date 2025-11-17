"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { OrganizationMember } from "@/convex/core/organizations/types";
import React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Crown,
  Edit,
  Globe,
  Settings,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { OrganizationForm } from "../_components/OrganizationForm";

type OrganizationMeta = Doc<"organizations"> & {
  memberCount?: number;
  userRole?: "owner" | "admin" | "editor" | "viewer" | "student";
};

const MEMBER_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
  { value: "student", label: "Student" },
] as const;

interface OrganizationDetailPageProps {
  params: Promise<{
    organizationId: string;
  }>;
}

export default function OrganizationDetailPage({
  params,
}: OrganizationDetailPageProps) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const organizationId = resolvedParams.organizationId as Id<"organizations">;

  // State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
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
  const plans = useQuery(api.core.organizations.queries.getPlans, {});
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
  const handleEdit = () => {
    setIsFormOpen(true);
  };

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

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    toast.success("Organization updated successfully");
  };

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

  const handleRoleChange = async (
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
  };

  const handleRemoveMember = async (userId: Id<"users">) => {
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
  };

  if (organization === undefined) {
    return <LoadingSpinner />;
  }

  if (organization === null) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Organization not found</h3>
          <p className="mb-4 text-muted-foreground">
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
    _id: Id<"plans">;
    displayName: string;
    priceMonthly: number;
  }[] = Array.isArray(plans)
    ? (plans as {
        _id: Id<"plans">;
        displayName: string;
        priceMonthly: number;
      }[])
    : [];
  const org = organization as OrganizationMeta;
  const currentPlan = planList.find(
    (plan) => org.planId && plan._id === org.planId,
  );
  const memberList: OrganizationMember[] = Array.isArray(members)
    ? (members as OrganizationMember[])
    : [];

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/settings/organizations")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-muted-foreground">
              Organization details and settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Organization
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
        </div>
      </div>

      {/* Organization Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Basic Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.name}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {organization.slug}
            </p>
          </CardContent>
        </Card>

        {/* Plan Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPlan?.displayName ?? "No Plan"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
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
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {organization.subscriptionStatus}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Subscription status
            </p>
          </CardContent>
        </Card>

        {/* Owner */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.ownerId ? "Assigned" : "No Owner"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Organization owner
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Organization Settings
            </CardTitle>
            <CardDescription>Configuration and access settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Visibility</span>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
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
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <Badge
                  variant={
                    organization.allowSelfRegistration ? "default" : "secondary"
                  }
                >
                  {organization.allowSelfRegistration ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Description</span>
              <span className="text-sm text-muted-foreground">
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
              <span className="rounded bg-muted px-2 py-1 font-mono text-xs">
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

      {/* Members */}
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
            className="grid gap-4 md:grid-cols-[1fr,_200px,_auto]"
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
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members yet. Add someone using their email address.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="font-medium">
                          {member.user.name ?? "Unnamed"}
                        </div>
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onValueChange={(value) =>
                            handleRoleChange(
                              member.userId,
                              value as (typeof MEMBER_ROLE_OPTIONS)[number]["value"],
                            )
                          }
                          disabled={
                            member.role === "owner" ||
                            roleUpdatingUserId === member.userId
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {member.role === "owner" ? (
                              <SelectItem value="owner">Owner</SelectItem>
                            ) : null}
                            {MEMBER_ROLE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={
                            member.role === "owner" ||
                            removingUserId === member.userId
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {organization.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {organization.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Form Dialog */}
      <OrganizationForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        organizationId={organizationId}
        onSuccess={handleFormSuccess}
        mode="dialog"
      />
    </div>
  );
}
