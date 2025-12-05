"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import type { ViewMode } from "@acme/ui/advanced/entity-list";
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

// Type for API response to match actual structure
interface ApiGroupMember {
  _id: Id<"groupMembers">;
  _creationTime: number;
  role: "admin" | "moderator" | "member";
  joinedAt: number;
  userId: Id<"users">;
  groupId: Id<"groups">;
  status: string;
  user: {
    _id: Id<"users">;
    name?: string;
    email: string;
    role: "admin" | "user";
  } | null;
}

interface GroupMembersDisplayProps {
  groupId: Id<"groups">;
  currentUserRole?: RoleType | null; // Role of the current user viewing the list
}

export function GroupMembersDisplay({
  groupId,
  currentUserRole,
}: GroupMembersDisplayProps) {
  const router = useRouter();
  // Local UI state (for EntityList's internal state)
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  // API query state (for server-side filtering)
  const [apiSearchTerm, setApiSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

  // Selected member state for dialogs
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(
    null,
  );
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "moderator" | "member">(
    "member",
  );

  // Ref to track previous search term to prevent loops
  const prevSearchRef = useRef("");

  // Convert currentUserRole to the format expected by PermissionGuard
  const userRoleForGuard: RoleType = useMemo(
    () => (currentUserRole === null ? undefined : currentUserRole),
    [currentUserRole],
  );

  // Debounce API search updates to prevent too many queries
  useEffect(() => {
    if (prevSearchRef.current === localSearchTerm) return;

    const timer = setTimeout(() => {
      setApiSearchTerm(localSearchTerm);
      prevSearchRef.current = localSearchTerm;
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Query args for members API - memoized to prevent unnecessary rerenders
  const membersQueryArgs = useMemo(
    () => ({
      groupId,
      roleFilter: roleFilter as "admin" | "moderator" | "member" | undefined,
      paginationOpts: {
        numItems: 100, // Fetch a reasonable number of members
        cursor: null, // Initialize with null cursor for first page
      },
    }),
    [groupId, roleFilter],
  );

  // Queries and mutations
  const membersQuery = useQuery(
    api.groups.queries.getGroupMembers,
    membersQueryArgs,
  );
  const updateMemberRoleMutation = useMutation(
    api.groups.updateGroupMemberRole,
  );
  const removeMemberMutation = useMutation(api.groups.removeGroupMember);

  const isLoading = membersQuery === undefined;

  // Apply client-side filtering for search since the API doesn't support it
  const members = useMemo(() => {
    const allMembers = membersQuery?.members ?? [];
    console.log("Raw members from API:", allMembers);

    // Map the API response to match our component's expected format
    const mappedMembers = (allMembers || []).map((member: ApiGroupMember) => {
      console.log("Processing member:", member);

      // Handle missing user data
      if (!member.user) {
        console.log("User data is null for a member");
        return {
          _id: member._id,
          role: member.role,
          joinedAt: member.joinedAt ?? member._creationTime,
          user: null,
        } as GroupMember;
      }

      // Create a mapped member with the expected structure
      return {
        _id: member._id,
        role: member.role,
        joinedAt: member.joinedAt ?? member._creationTime,
        user: {
          id: member.user._id,
          name: member.user.name ?? "Unknown User",
          email: member.user.email,
          // Don't include image as it doesn't exist in the API response
        },
      } as GroupMember;
    });

    console.log("Mapped members:", mappedMembers);

    // If no search term, return all members
    if (!apiSearchTerm) return mappedMembers;

    // Apply client-side search filtering
    return mappedMembers.filter((member: GroupMember) => {
      if (!member.user) return false;

      const userName = (member.user.name ?? "").toLowerCase();
      const userEmail = (member.user.email ?? "").toLowerCase();
      const searchLower = apiSearchTerm.toLowerCase();

      return userName.includes(searchLower) || userEmail.includes(searchLower);
    });
  }, [membersQuery?.members, apiSearchTerm]);

  // Handle role changes
  const handleChangeRole = useCallback(async () => {
    if (!selectedMember?.user) return;
    try {
      await updateMemberRoleMutation({
        groupId,
        memberId: selectedMember.user.id,
        newRole,
      });
      setIsChangeRoleDialogOpen(false);
    } catch (error) {
      console.error("Error updating member role:", error);
    }
  }, [groupId, newRole, selectedMember, updateMemberRoleMutation]);

  // Handle member removal
  const handleRemoveMember = useCallback(async () => {
    if (!selectedMember?.user) return;
    try {
      await removeMemberMutation({
        groupId,
        memberId: selectedMember.user.id,
      });
      setIsRemoveDialogOpen(false);
    } catch (error) {
      console.error("Error removing member:", error);
    }
  }, [groupId, selectedMember, removeMemberMutation]);

  // Role filter handler - memoized to prevent rerenders
  const handleRoleFilterChange = useCallback((role: string) => {
    setRoleFilter(role === "all" ? undefined : role);
  }, []);

  // Format date for display - memoized to prevent rerenders
  const formatJoinDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  }, []);

  // Get badge component for role - memoized to prevent rerenders
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

  // Get icon component for role - memoized to prevent rerenders
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

  // Define sort options for EntityList - memoized to prevent rerenders
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

  // Define filter options for EntityList - memoized to prevent rerenders
  const filterOptions = useMemo(
    () => [
      {
        id: "role",
        label: "Role",
        options: [
          {
            id: "admin",
            label: "Admin",
            value: "admin",
            getIsMatch: (member: GroupMember) => member.role === "admin",
          },
          {
            id: "moderator",
            label: "Moderator",
            value: "moderator",
            getIsMatch: (member: GroupMember) => member.role === "moderator",
          },
          {
            id: "member",
            label: "Member",
            value: "member",
            getIsMatch: (member: GroupMember) => member.role === "member",
          },
        ],
      },
    ],
    [],
  );

  // Custom search predicate that avoids state updates during filtering
  // This is key to preventing the infinite loop
  const searchPredicate = useCallback((member: GroupMember, search: string) => {
    // IMPORTANT: Update localSearchTerm only if it's different,
    // and only once per distinct search term
    if (prevSearchRef.current !== search) {
      setLocalSearchTerm(search);
      prevSearchRef.current = search;
    }

    // Still perform local filtering for immediate feedback
    if (!search) return true;
    if (!member.user) return false;

    const lowerSearch = search.toLowerCase();
    const userName = member.user.name.toLowerCase();
    const userEmail = member.user.email.toLowerCase();

    return userName.includes(lowerSearch) || userEmail.includes(lowerSearch);
  }, []);

  // Render a member card - memoized with dependencies
  const renderMemberCard = useCallback(
    (member: GroupMember, _viewMode: ViewMode) => {
      const { user } = member;

      // Debug what's happening with the user data
      console.log("Rendering member card:", member);

      if (!user) {
        return (
          <Card className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">Unknown</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-medium leading-none">Unknown User</h3>
                  <p className="text-xs text-muted-foreground">
                    User data not available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      const canManage =
        currentUserRole === "admin" ||
        (currentUserRole === "moderator" && member.role === "member");

      return (
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getRoleIcon(member.role)}
                {getRoleBadge(member.role)}
              </div>
              {canManage && (
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
                          <Shield className="mr-2 h-4 w-4" /> Change Role
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
                        <UserMinus className="mr-2 h-4 w-4" /> Remove Member
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
                {user.image && (
                  <AvatarImage src={user.image} alt={user.name ?? "Member"} />
                )}
                <AvatarFallback>
                  {user.name ? user.name.charAt(0) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-medium leading-none">
                  {user.name ?? "Unknown user"}
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
                View Profile <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    },
    [
      currentUserRole,
      formatJoinDate,
      getRoleBadge,
      getRoleIcon,
      router,
      userRoleForGuard,
    ],
  );

  return (
    <div className="space-y-6">
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

      {/* EntityList component */}
      <EntityList
        items={members}
        renderItem={renderMemberCard}
        isLoading={isLoading}
        loadingMessage="Loading members..."
        emptyMessage="No members found."
        searchPlaceholder="Search members by name or email..."
        searchPredicate={searchPredicate}
        sortOptions={sortOptions}
        filterOptions={filterOptions}
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
