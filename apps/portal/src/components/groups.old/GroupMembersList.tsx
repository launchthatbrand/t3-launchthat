"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUpRight,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  User,
  UserMinus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { EntityList } from "@acme/ui/advanced/entity-list";
import { PermissionGuard } from "@acme/ui/advanced/permission-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

// Define role type to match PermissionGuard requirements
type RoleType = "admin" | "moderator" | "member" | undefined;

interface GroupMembersListProps {
  groupId: Id<"groups"> | string;
  userRole?: RoleType | null;
}

// Member types
interface GroupMember {
  _id: Id<"groupMembers">;
  role: "admin" | "moderator" | "member";
  joinedAt: number;
  user: {
    id: Id<"users">;
    name: string;
    image?: string;
    email: string;
  } | null;
}

export function GroupMembersList({
  groupId,
  userRole: propUserRole,
}: GroupMembersListProps) {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(
    null,
  );
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "moderator" | "member">(
    "member",
  );

  // Convert propUserRole to the expected type for PermissionGuard
  const userRoleForGuard: RoleType = useMemo(
    () => (propUserRole === null ? undefined : propUserRole),
    [propUserRole],
  );

  // Memoize the query args to prevent unnecessary re-renders
  const membersQueryArgs = useMemo(
    () => ({
      groupId: groupId as Id<"groups">,
      roleFilter: roleFilter as "admin" | "moderator" | "member" | undefined,
      paginationOpts: {
        numItems: 100, // Fetch a reasonable number of members
        cursor: null, // Initialize with null cursor for first page
      },
    }),
    [groupId, roleFilter],
  );

  // Queries and mutations - we must call these unconditionally
  const membersQuery = useQuery(
    api.groups.queries.getGroupMembers,
    membersQueryArgs,
  );
  const updateMemberRole = useMutation(api.groups.updateGroupMemberRole);
  const removeMember = useMutation(api.groups.removeGroupMember);

  // Safely extract data from query results
  const rawMembers = membersQuery?.members ?? [];
  const isLoading = membersQuery === undefined;

  // Map the API response to match our component's expected format
  const members = useMemo(() => {
    return rawMembers.map((member) => {
      // Create a base user object with required properties
      const baseUser = member.user
        ? {
            id: member.user._id,
            name: member.user.name ?? "Unknown User",
            email: member.user.email,
          }
        : null;

      // Handle the image field by checking if it exists on the object
      if (baseUser && member.user && "image" in member.user) {
        // Add image field if it exists
        return {
          ...member,
          user: {
            ...baseUser,
            image: member.user.image as string | undefined,
          },
        };
      }

      return {
        ...member,
        user: baseUser,
      };
    });
  }, [rawMembers]);

  const handleChangeRole = async () => {
    if (!selectedMember?.user) return;

    try {
      await updateMemberRole({
        groupId: groupId as Id<"groups">,
        memberId: selectedMember.user.id,
        newRole,
      });

      toast.success("Member role updated", {
        description: `${selectedMember.user.name}'s role has been changed to ${newRole}`,
      });

      setIsChangeRoleDialogOpen(false);
    } catch (error) {
      console.error("Error updating member role:", error);
      toast.error("Failed to update member role", {
        description:
          "Please try again later or contact support if the issue persists.",
      });
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    if (!selectedMember.user) return;

    try {
      await removeMember({
        groupId: groupId as Id<"groups">,
        memberId: selectedMember.user.id,
      });

      toast.success("Member removed", {
        description: `${selectedMember.user.name} has been removed from the group`,
      });

      setIsRemoveDialogOpen(false);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member", {
        description:
          "Please try again later or contact support if the issue persists.",
      });
    }
  };

  // Handle filtering
  const handleRoleFilterChange = useCallback((role: string) => {
    setRoleFilter(role === "all" ? undefined : role);
  }, []);

  // Format join date
  const formatJoinDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  }, []);

  const getRoleBadge = useCallback((role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "moderator":
        return <Badge variant="secondary">Moderator</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  }, []);

  const getRoleIcon = useCallback((role: string) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="h-4 w-4 text-primary" />;
      case "moderator":
        return <Shield className="h-4 w-4 text-secondary" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  }, []);

  // Define sort options - memoize to prevent rerender
  const sortOptions = useMemo(
    () => [
      {
        id: "role",
        label: "Role",
        accessor: (member: GroupMember) => {
          switch (member.role) {
            case "admin":
              return 0;
            case "moderator":
              return 1;
            case "member":
              return 2;
            default:
              return 3;
          }
        },
      },
      {
        id: "name",
        label: "Name",
        accessor: (member: GroupMember) => member.user?.name ?? "",
      },
      {
        id: "joined",
        label: "Join Date",
        accessor: (member: GroupMember) => member.joinedAt,
      },
    ],
    [],
  );

  // Create a stable searchPredicate function that won't change between renders
  const searchPredicate = useCallback((member: GroupMember, search: string) => {
    const lowerSearch = search.toLowerCase();
    if (!member.user) return false;

    const userName = (member.user.name || "").toLowerCase();
    const userEmail = (member.user.email || "").toLowerCase();

    return userName.includes(lowerSearch) || userEmail.includes(lowerSearch);
  }, []);

  // Render a member card - memoize with explicit dependencies
  const renderMember = useCallback(
    (member: GroupMember) => {
      const { user } = member;
      if (!user) {
        return <Card className="overflow-hidden">User data not available</Card>;
      }

      const isCurrentUser = user.id === "current-user-id";
      const canManage =
        propUserRole === "admin" ||
        (propUserRole === "moderator" && member.role === "member");

      return (
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getRoleIcon(member.role)}
                {getRoleBadge(member.role)}
              </div>

              {canManage && !isCurrentUser && (
                <PermissionGuard
                  userRole={userRoleForGuard}
                  requiredRole="moderator"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <PermissionGuard
                        userRole={userRoleForGuard}
                        requiredRole="admin"
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMember(member);
                            setNewRole(member.role);
                            setIsChangeRoleDialogOpen(true);
                          }}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                      </PermissionGuard>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedMember(member);
                          setIsRemoveDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove from Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PermissionGuard>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.image} alt={user.name || "Member"} />
                <AvatarFallback>
                  {user.name ? user.name.charAt(0) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-medium leading-none">
                  {user.name || "Unknown user"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Joined {formatJoinDate(member.joinedAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/users/${user.id}`)}
              >
                View Profile
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    },
    [
      getRoleIcon,
      getRoleBadge,
      propUserRole,
      userRoleForGuard,
      formatJoinDate,
      router,
    ],
  );

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Members</h2>
        <div className="flex items-center gap-2">
          <Select
            value={roleFilter ?? "all"}
            onValueChange={handleRoleFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="moderator">Moderators</SelectItem>
              <SelectItem value="member">Members</SelectItem>
            </SelectContent>
          </Select>

          <PermissionGuard userRole={userRoleForGuard} requiredRole="moderator">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/groups/${groupId}/members/manage`)}
            >
              Manage
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Show the EntityList component */}
      <EntityList
        items={members}
        renderItem={renderMember}
        isLoading={isLoading}
        loadingMessage="Loading members..."
        emptyMessage="No members found."
        searchPlaceholder="Search members..."
        searchPredicate={searchPredicate}
        sortOptions={sortOptions}
        defaultSort={{ option: "role", direction: "asc" }}
        defaultViewMode="grid"
        gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        gridItemClassName="h-full"
      />

      {/* Change Role Dialog */}
      <Dialog
        open={isChangeRoleDialogOpen}
        onOpenChange={setIsChangeRoleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedMember?.user?.name}. Different roles
              have different permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              value={newRole}
              onValueChange={(value) =>
                setNewRole(value as "admin" | "moderator" | "member")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-4 rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Role permissions:</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>
                  • <strong>Admin:</strong> Full control over the group,
                  including settings and member management
                </li>
                <li>
                  • <strong>Moderator:</strong> Can manage members and content,
                  but cannot change group settings
                </li>
                <li>
                  • <strong>Member:</strong> Can view and participate in the
                  group based on group settings
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.user?.name} from
              the group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember}>
              <UserX className="mr-2 h-4 w-4" />
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
